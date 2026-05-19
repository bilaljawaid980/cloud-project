import type { UploadSession, UserProfile, VideoMetadata, ViewEvent } from "@clipforge/shared/types";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { config } from "../config/env";
import { documentClient } from "./table";
import {
  fromUploadSessionItem,
  fromUserProfileItem,
  fromVideoItem,
  shareRefKeys,
  shareSlugKeys,
  toShareRefItem,
  toUploadSessionItem,
  toUserProfileItem,
  toVideoItem,
  toViewEventItem,
  uploadSessionByIdKeys,
  userProfileKeys,
  videoByIdKeys
} from "./entities";

interface QueryPageResult {
  items: VideoMetadata[];
  nextKey?: Record<string, unknown>;
}

const memoryUsers = new Map<string, UserProfile>();
const memoryVideos = new Map<string, VideoMetadata>();
const memoryShareSlugToVideoId = new Map<string, string>();
const memoryUploads = new Map<string, UploadSession>();
const memoryViewEvents = new Map<string, ViewEvent[]>();

const shouldFallbackToMemory = (error: unknown): boolean => {
  if (!config.devMode) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return [
    "Requested resource not found",
    "ResourceNotFoundException",
    "Could not load credentials",
    "Resolved credential object is not valid",
    "ECONNREFUSED",
    "connect ECONNREFUSED",
    "The security token included in the request is invalid",
    "Missing credentials"
  ].some((fragment) => message.includes(fragment));
};

const withDevFallback = async <T>(operation: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (!shouldFallbackToMemory(error)) {
      throw error;
    }

    console.warn(
      JSON.stringify({
        level: "warn",
        mode: "dev-memory-store",
        message: error instanceof Error ? error.message : String(error)
      })
    );

    return fallback();
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> =>
  withDevFallback(
    async () => {
      const result = await documentClient.send(
        new GetCommand({
          TableName: config.dynamoTable,
          Key: userProfileKeys(userId)
        })
      );

      return result.Item ? fromUserProfileItem(result.Item) : null;
    },
    () => memoryUsers.get(userId) ?? null
  );

export const upsertUserProfile = async (profile: UserProfile): Promise<UserProfile> =>
  withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toUserProfileItem(profile)
        })
      );

      return profile;
    },
    () => {
      memoryUsers.set(profile.userId, profile);
      return profile;
    }
  );

export const createVideo = async (video: VideoMetadata): Promise<VideoMetadata> =>
  withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toVideoItem(video)
        })
      );

      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toShareRefItem(video)
        })
      );

      return video;
    },
    () => {
      memoryVideos.set(video.videoId, video);
      memoryShareSlugToVideoId.set(video.shareSlug, video.videoId);
      return video;
    }
  );

export const getVideoById = async (videoId: string): Promise<VideoMetadata | null> =>
  withDevFallback(
    async () => {
      const result = await documentClient.send(
        new QueryCommand({
          TableName: config.dynamoTable,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk and gsi1sk = :sk",
          ExpressionAttributeValues: {
            ":pk": videoByIdKeys(videoId).gsi1pk,
            ":sk": videoByIdKeys(videoId).gsi1sk
          },
          Limit: 1
        })
      );

      const item = result.Items?.[0];
      return item ? fromVideoItem(item) : null;
    },
    () => memoryVideos.get(videoId) ?? null
  );

export const getVideoByShareSlug = async (shareSlug: string): Promise<VideoMetadata | null> =>
  withDevFallback(
    async () => {
      const queryResult = await documentClient.send(
        new QueryCommand({
          TableName: config.dynamoTable,
          IndexName: "GSI2",
          KeyConditionExpression: "gsi2pk = :pk and gsi2sk = :sk",
          ExpressionAttributeValues: {
            ":pk": shareSlugKeys(shareSlug).gsi2pk,
            ":sk": shareSlugKeys(shareSlug).gsi2sk
          },
          Limit: 1
        })
      );

      const projectedItem = queryResult.Items?.[0] as { videoId?: string } | undefined;
      if (projectedItem?.videoId) {
        return getVideoById(projectedItem.videoId);
      }

      const shareRef = await documentClient.send(
        new GetCommand({
          TableName: config.dynamoTable,
          Key: shareRefKeys(shareSlug)
        })
      );

      const fallbackVideoId = (shareRef.Item as { videoId?: string } | undefined)?.videoId;
      return fallbackVideoId ? getVideoById(fallbackVideoId) : null;
    },
    () => {
      const videoId = memoryShareSlugToVideoId.get(shareSlug);
      return videoId ? memoryVideos.get(videoId) ?? null : null;
    }
  );

export const listUserVideos = async (
  ownerId: string,
  limit: number,
  cursor?: Record<string, unknown>
): Promise<QueryPageResult> =>
  withDevFallback(
    async () => {
      const result = await documentClient.send(
        new QueryCommand({
          TableName: config.dynamoTable,
          KeyConditionExpression: "pk = :pk and begins_with(sk, :prefix)",
          ExpressionAttributeValues: {
            ":pk": `USER#${ownerId}`,
            ":prefix": "VIDEO#"
          },
          ScanIndexForward: false,
          Limit: limit,
          ExclusiveStartKey: cursor
        })
      );

      const items = (result.Items ?? []).map((item) => fromVideoItem(item));
      return {
        items,
        nextKey: result.LastEvaluatedKey as Record<string, unknown> | undefined
      };
    },
    () => {
      const offset = typeof cursor?.offset === "number" ? cursor.offset : 0;
      const items = Array.from(memoryVideos.values())
        .filter((video) => video.ownerId === ownerId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      const page = items.slice(offset, offset + limit);
      const nextOffset = offset + limit;

      return {
        items: page,
        nextKey: nextOffset < items.length ? { offset: nextOffset } : undefined
      };
    }
  );

export const updateVideo = async (
  currentVideo: VideoMetadata,
  updates: Partial<VideoMetadata>
): Promise<VideoMetadata> => {
  const nextVideo: VideoMetadata = {
    ...currentVideo,
    ...updates
  };

  return withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toVideoItem(nextVideo)
        })
      );

      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toShareRefItem(nextVideo)
        })
      );

      return nextVideo;
    },
    () => {
      memoryVideos.set(nextVideo.videoId, nextVideo);
      memoryShareSlugToVideoId.set(nextVideo.shareSlug, nextVideo.videoId);
      return nextVideo;
    }
  );
};

export const softDeleteVideo = async (currentVideo: VideoMetadata, deletedAt: string): Promise<VideoMetadata> =>
  updateVideo(currentVideo, {
    status: "deleted",
    deletedAt,
    updatedAt: deletedAt
  });

export const createUploadSession = async (session: UploadSession): Promise<UploadSession> =>
  withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toUploadSessionItem(session)
        })
      );

      return session;
    },
    () => {
      memoryUploads.set(session.uploadId, session);
      return session;
    }
  );

export const getUploadSession = async (uploadId: string): Promise<UploadSession | null> =>
  withDevFallback(
    async () => {
      const result = await documentClient.send(
        new QueryCommand({
          TableName: config.dynamoTable,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk and gsi1sk = :sk",
          ExpressionAttributeValues: {
            ":pk": uploadSessionByIdKeys(uploadId).gsi1pk,
            ":sk": uploadSessionByIdKeys(uploadId).gsi1sk
          },
          Limit: 1
        })
      );

      const item = result.Items?.[0];
      return item ? fromUploadSessionItem(item) : null;
    },
    () => memoryUploads.get(uploadId) ?? null
  );

export const updateUploadSession = async (
  currentSession: UploadSession,
  updates: Partial<UploadSession>
): Promise<UploadSession> => {
  const nextSession: UploadSession = {
    ...currentSession,
    ...updates
  };

  return withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toUploadSessionItem(nextSession)
        })
      );

      return nextSession;
    },
    () => {
      memoryUploads.set(nextSession.uploadId, nextSession);
      return nextSession;
    }
  );
};

export const createViewEvent = async (event: ViewEvent): Promise<ViewEvent> =>
  withDevFallback(
    async () => {
      await documentClient.send(
        new PutCommand({
          TableName: config.dynamoTable,
          Item: toViewEventItem(event)
        })
      );

      return event;
    },
    () => {
      const events = memoryViewEvents.get(event.videoId) ?? [];
      events.push(event);
      memoryViewEvents.set(event.videoId, events);
      return event;
    }
  );

export const countViewEvents = async (videoId: string): Promise<number> =>
  withDevFallback(
    async () => {
      const result = await documentClient.send(
        new QueryCommand({
          TableName: config.dynamoTable,
          KeyConditionExpression: "pk = :pk and begins_with(sk, :prefix)",
          ExpressionAttributeValues: {
            ":pk": `VIDEO#${videoId}`,
            ":prefix": "VIEW#"
          },
          Select: "COUNT"
        })
      );

      return result.Count ?? 0;
    },
    () => (memoryViewEvents.get(videoId) ?? []).length
  );
