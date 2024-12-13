import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

const TMP_DIR = join(process.cwd(), 'tmp');

// 确保临时目录存在
if (!existsSync(TMP_DIR)) {
  await mkdir(TMP_DIR, { recursive: true });
}

app.post('/api/tts', async (req, res) => {
  const { text, voice, rate = 1 } = req.body;
  
  if (!text || !voice) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  console.log('TTS Request:', { text, voice, rate });
  const outputFile = join(TMP_DIR, `${uuidv4()}.mp3`);

  try {
    // 转义文本中的引号
    const escapedText = text.replace(/"/g, '\\"');
    
    // 转换语速为百分比格式
    const ratePercent = `${Math.round((rate - 1) * 100)}%`;
    const rateParam = ratePercent.startsWith('-') ? ratePercent : `+${ratePercent}`;
    
    // 使用 edge-tts 生成音频
    const command = `/venv/bin/python -m edge_tts --voice ${voice} --rate=${rateParam} --text "${escapedText}" --write-media ${outputFile}`;
    console.log('Running command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error('Command stderr:', stderr);
    }
    if (stdout) {
      console.log('Command stdout:', stdout);
    }

    // 检查文件是否生成
    if (!existsSync(outputFile)) {
      throw new Error('Audio file was not generated');
    }

    // 发送音频文件
    res.sendFile(outputFile);

    // 清理临时文件
    setTimeout(async () => {
      try {
        await unlink(outputFile);
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'TTS generation failed',
      details: error.message,
      command: error.cmd
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`TTS server running on port ${port}`);
});
