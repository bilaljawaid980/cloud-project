import type {
  UploadSession,
  UserProfile,
  VideoMetadata,
  VideoVisibility,
  ViewEvent
} from "@clipforge/shared/types";

export interface UserProfileItem extends UserProfile {
  pk: string;
  sk: string;
  entityType: "USER_PROFILE";
}

export interface VideoItem extends VideoMetadata {
  pk: string;
  sk: string;
  entityType: "VIDEO";
  gsi1pk: string;
  gsi1sk: string;
  gsi2pk: string;
  gsi2sk: string;
}

export interface UploadSessionItem extends UploadSession {
  pk: string;
  sk: string;
  entityType: "UPLOAD_SESSION";
  gsi1pk: string;
  gsi1sk: string;
}

export interface ViewEventItem extends ViewEvent {
  pk: string;
  sk: string;
  entityType: "VIEW_EVENT";
}

export interface ShareRefItem {
  pk: string;
  sk: string;
  entityType: "SHARE_REF";
  videoId: string;
  ownerId: string;
  visibility: VideoVisibility;
}

export const userProfileKeys = (userId: string) => ({
  pk: `USER#${userId}`,
  sk: "PROFILE"
});

export const videoKeys = (ownerId: string, createdAt: string, videoId: string) => ({
  pk: `USER#${ownerId}`,
  sk: `VIDEO#${createdAt}#${videoId}`
});

export const videoByIdKeys = (videoId: string) => ({
  gsi1pk: `VIDEO#${videoId}`,
  gsi1sk: "METADATA"
});

export const shareSlugKeys = (shareSlug: string) => ({
  gsi2pk: `SHARE#${shareSlug}`,
  gsi2sk: "VIDEO"
});

export const shareRefKeys = (shareSlug: string) => ({
  pk: `SHARE#${shareSlug}`,
  sk: "REF"
});

export const uploadSessionKeys = (ownerId: string, uploadId: string) => ({
  pk: `USER#${ownerId}`,
  sk: `UPLOAD#${uploadId}`
});

export const uploadSessionByIdKeys = (uploadId: string) => ({
  gsi1pk: `UPLOAD#${uploadId}`,
  gsi1sk: "SESSION"
});

export const viewEventKeys = (videoId: string, createdAt: string, eventId: string) => ({
  pk: `VIDEO#${videoId}`,
  sk: `VIEW#${createdAt}#${eventId}`
});

export const toUserProfileItem = (profile: UserProfile): UserProfileItem => ({
  ...userProfileKeys(profile.userId),
  ...profile,
  entityType: "USER_PROFILE"
});

export const toVideoItem = (video: VideoMetadata): VideoItem => ({
  ...videoKeys(video.ownerId, video.createdAt, video.videoId),
  ...videoByIdKeys(video.videoId),
  ...shareSlugKeys(video.shareSlug),
  ...video,
  entityType: "VIDEO"
});

export const toShareRefItem = (video: VideoMetadata): ShareRefItem => ({
  ...shareRefKeys(video.shareSlug),
  entityType: "SHARE_REF",
  videoId: video.videoId,
  ownerId: video.ownerId,
  visibility: video.visibility
});

export const toUploadSessionItem = (session: UploadSession): UploadSessionItem => ({
  ...uploadSessionKeys(session.ownerId, session.uploadId),
  ...uploadSessionByIdKeys(session.uploadId),
  ...session,
  entityType: "UPLOAD_SESSION"
});

export const toViewEventItem = (event: ViewEvent): ViewEventItem => ({
  ...viewEventKeys(event.videoId, event.createdAt, event.eventId),
  ...event,
  entityType: "VIEW_EVENT"
});

export const fromUserProfileItem = (item: Record<string, unknown>): UserProfile => {
  const typed = item as unknown as UserProfileItem;
  return {
    userId: typed.userId,
    email: typed.email,
    name: typed.name,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt
  };
};

export const fromVideoItem = (item: Record<string, unknown>): VideoMetadata => {
  const typed = item as unknown as VideoItem;
  return {
    videoId: typed.videoId,
    ownerId: typed.ownerId,
    shareSlug: typed.shareSlug,
    title: typed.title,
    description: typed.description,
    visibility: typed.visibility,
    status: typed.status,
    mimeType: typed.mimeType,
    sizeBytes: typed.sizeBytes,
    durationMs: typed.durationMs,
    recordingType: typed.recordingType,
    thumbnailObjectKey: typed.thumbnailObjectKey,
    originalObjectKey: typed.originalObjectKey,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt,
    readyAt: typed.readyAt,
    deletedAt: typed.deletedAt
  };
};

export const fromUploadSessionItem = (item: Record<string, unknown>): UploadSession => {
  const typed = item as unknown as UploadSessionItem;
  return {
    uploadId: typed.uploadId,
    videoId: typed.videoId,
    ownerId: typed.ownerId,
    s3UploadId: typed.s3UploadId,
    objectKey: typed.objectKey,
    mimeType: typed.mimeType,
    sizeBytes: typed.sizeBytes,
    partSizeBytes: typed.partSizeBytes,
    partCount: typed.partCount,
    status: typed.status,
    expiresAt: typed.expiresAt,
    createdAt: typed.createdAt,
    updatedAt: typed.updatedAt
  };
};
