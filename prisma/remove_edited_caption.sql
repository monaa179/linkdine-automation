-- Migration to remove editedCaption column and keep only aiCaption
-- This will merge editedCaption into aiCaption where it exists

-- First, update aiCaption with editedCaption where editedCaption is not null
UPDATE posts 
SET aiCaption = editedCaption 
WHERE editedCaption IS NOT NULL AND editedCaption != '';

-- Then drop the editedCaption column
ALTER TABLE posts DROP COLUMN editedCaption;
