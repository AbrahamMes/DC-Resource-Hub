import fs from 'fs';
import path from 'path';

function temporaryPath(filePath) {
  return `${filePath}.${process.pid}.${Date.now()}.tmp`;
}

export function atomicWriteFileSync(filePath, data, options = 'utf8') {
  const tempPath = temporaryPath(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  try {
    fs.writeFileSync(tempPath, data, options);
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    try { fs.unlinkSync(tempPath); } catch {}
    throw error;
  }
}

export async function atomicWriteFile(filePath, data, options = 'utf8') {
  const tempPath = temporaryPath(filePath);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.promises.writeFile(tempPath, data, options);
    await fs.promises.rename(tempPath, filePath);
  } catch (error) {
    try { await fs.promises.unlink(tempPath); } catch {}
    throw error;
  }
}

