import { writeFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const csvContent = await req.text();
    const filePath = join(process.cwd(), 'public', 'data', 'articles.csv');
    
    await writeFile(filePath, csvContent, 'utf-8');
    
    return new Response('Articles saved successfully', { status: 200 });
  } catch (error) {
    console.error('Error saving articles:', error);
    return new Response('Failed to save articles', { status: 500 });
  }
}