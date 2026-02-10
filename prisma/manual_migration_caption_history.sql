-- Manual migration to add caption_history table
-- Run this SQL directly on your database

CREATE TABLE IF NOT EXISTS `caption_history` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `postId` INTEGER NOT NULL,
  `previousCaption` TEXT NULL,
  `newCaption` TEXT NOT NULL,
  `modifiedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `caption_history_postId_fkey` (`postId`),
  CONSTRAINT `caption_history_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
