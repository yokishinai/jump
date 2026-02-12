import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 自定义插件：复制 music 和 img 文件夹到 dist，并生成音乐列表
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    buildStart() {
      // 在构建开始时生成音乐列表
      const musicDir = path.resolve(__dirname, 'music');
      const musicFiles = readdirSync(musicDir)
        .filter(file => /\.(mp3|wav|ogg|m4a|flac)$/i.test(file))
        .map(file => `./music/${file}`);
      
      // 生成 musicList.json 文件
      const musicListPath = path.resolve(__dirname, 'public/musicList.json');
      mkdirSync(path.dirname(musicListPath), { recursive: true });
      writeFileSync(musicListPath, JSON.stringify(musicFiles, null, 2));
      console.log(`✓ Generated music list with ${musicFiles.length} files`);
    },
    closeBundle() {
      const copyDir = (src: string, dest: string) => {
        mkdirSync(dest, { recursive: true });
        const entries = readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            copyFileSync(srcPath, destPath);
          }
        }
      };
      
      // 复制 music 和 img 文件夹
      copyDir(path.resolve(__dirname, 'music'), path.resolve(__dirname, 'dist/music'));
      copyDir(path.resolve(__dirname, 'img'), path.resolve(__dirname, 'dist/img'));
      console.log('✓ Copied music and img folders to dist');
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/jump/',
  plugins: [react(), tailwindcss(), copyStaticAssets()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
