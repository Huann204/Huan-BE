const params = '?auto=format&fit=crop&w=1000&q=82';

export const vocabularyTopicImages: Record<string, string> = {
  'daily-life': `https://images.unsplash.com/photo-1499750310107-5fef28a66643${params}`,
  food: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c${params}`,
  work: `https://images.unsplash.com/photo-1497366754035-f200968a6e72${params}`,
  family: `https://images.unsplash.com/photo-1511895426328-dc8714191300${params}`,
  home: `https://images.unsplash.com/photo-1600585154340-be6161a56a0c${params}`,
  school: `https://images.unsplash.com/photo-1509062522246-3755977927d7${params}`,
  travel: `https://images.unsplash.com/photo-1488646953014-85cb44e25828${params}`,
  transport: `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957${params}`,
  shopping: `https://images.unsplash.com/photo-1441986300917-64674bd600d8${params}`,
  health: `https://images.unsplash.com/photo-1505751172876-fa1923c5c528${params}`,
  weather: `https://images.unsplash.com/photo-1504608524841-42fe6f032b4b${params}`,
  emotions: `https://images.unsplash.com/photo-1529156069898-49953e39b3ac${params}`,
  hobbies: `https://images.unsplash.com/photo-1513364776144-60967b0f800f${params}`,
  technology: `https://images.unsplash.com/photo-1518770660439-4636190af475${params}`,
  nature: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e${params}`,
};

export const topicImage = (slug: string): string | null => vocabularyTopicImages[slug] ?? null;
