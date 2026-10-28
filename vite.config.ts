import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // đường dẫn tương đối để deploy được lên GitHub Pages hoặc bất kỳ thư mục con nào
  base: './',
  // nhúng ảnh vào bundle để bản Artifact một file vẫn hiển thị được ảnh thật
  build: { assetsInlineLimit: 50 * 1024 * 1024 },
});
