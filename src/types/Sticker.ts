export type Sticker = {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'legendary';
  createdAt: string;
};