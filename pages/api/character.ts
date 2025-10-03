import type { NextApiRequest, NextApiResponse } from 'next';
import { Character } from '../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Character>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({} as Character);
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/character`);
    const character = await response.json();

    res.status(200).json(character);
  } catch (error) {
    res.status(500).json({} as Character);
  }
}