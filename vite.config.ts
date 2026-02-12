import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 自定义插件：复制 music 和 img 文件夹到 dist
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
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
