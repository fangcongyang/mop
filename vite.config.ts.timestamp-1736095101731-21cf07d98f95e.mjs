// vite.config.ts
import { defineConfig } from "file:///D:/app/mop/node_modules/.pnpm/vite@5.4.8_@types+node@22.7.4_sass@1.79.4_terser@5.34.1/node_modules/vite/dist/node/index.js";
import react from "file:///D:/app/mop/node_modules/.pnpm/@vitejs+plugin-react@4.3.2_vite@5.4.8_@types+node@22.7.4_sass@1.79.4_terser@5.34.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { createSvgIconsPlugin } from "file:///D:/app/mop/node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_vite@5.4.8_@types+node@22.7.4_sass@1.79.4_terser@5.34.1_/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import { internalIpV4 } from "file:///D:/app/mop/node_modules/.pnpm/internal-ip@7.0.0/node_modules/internal-ip/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\app\\mop";
var mobile = !!/android|ios/.exec(process.env.TAURI_ENV_PLATFORM);
var vite_config_default = defineConfig(async ({ mode }) => ({
  plugins: [
    react(),
    createSvgIconsPlugin({
      // 指定需要缓存的图标文件夹
      iconDirs: [path.resolve(__vite_injected_original_dirname, "./src/assets/icons")],
      // 指定symbolId格式
      symbolId: "icon-[dir]-[name]",
      // 自定义插入位置
      inject: "body-last",
      customDomId: "__svg__icons__dom__"
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 2420,
    strictPort: true,
    host: mobile ? "0.0.0.0" : "0.0.0.0",
    hmr: mobile ? {
      protocol: "ws",
      host: await internalIpV4(),
      port: 1421
    } : void 0,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"]
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxhcHBcXFxcbW9wXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxhcHBcXFxcbW9wXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9hcHAvbW9wL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN2Zy1pY29ucyc7XHJcbmltcG9ydCB7IGludGVybmFsSXBWNCB9IGZyb20gXCJpbnRlcm5hbC1pcFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmNvbnN0IG1vYmlsZSA9ICEhL2FuZHJvaWR8aW9zLy5leGVjKHByb2Nlc3MuZW52LlRBVVJJX0VOVl9QTEFURk9STSk7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYXN5bmMgKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLFxyXG4gIGNyZWF0ZVN2Z0ljb25zUGx1Z2luKHtcclxuICAgIC8vIFx1NjMwN1x1NUI5QVx1OTcwMFx1ODk4MVx1N0YxM1x1NUI1OFx1NzY4NFx1NTZGRVx1NjgwN1x1NjU4N1x1NEVGNlx1NTkzOVxyXG4gICAgaWNvbkRpcnM6IFtwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvYXNzZXRzL2ljb25zJyldLFxyXG4gICAgLy8gXHU2MzA3XHU1QjlBc3ltYm9sSWRcdTY4M0NcdTVGMEZcclxuICAgIHN5bWJvbElkOiAnaWNvbi1bZGlyXS1bbmFtZV0nLFxyXG4gICAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU2M0QyXHU1MTY1XHU0RjREXHU3RjZFXHJcbiAgICBpbmplY3Q6ICdib2R5LWxhc3QnLFxyXG4gICAgY3VzdG9tRG9tSWQ6ICdfX3N2Z19faWNvbnNfX2RvbV9fJyxcclxuICB9KSxdLFxyXG5cclxuXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gVml0ZSBvcHRpb25zIHRhaWxvcmVkIGZvciBUYXVyaSBkZXZlbG9wbWVudCBhbmQgb25seSBhcHBsaWVkIGluIGB0YXVyaSBkZXZgIG9yIGB0YXVyaSBidWlsZGBcclxuICAvL1xyXG4gIC8vIDEuIHByZXZlbnQgdml0ZSBmcm9tIG9ic2N1cmluZyBydXN0IGVycm9yc1xyXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcclxuICAvLyAyLiB0YXVyaSBleHBlY3RzIGEgZml4ZWQgcG9ydCwgZmFpbCBpZiB0aGF0IHBvcnQgaXMgbm90IGF2YWlsYWJsZVxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMjQyMCxcclxuICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICBob3N0OiBtb2JpbGUgPyBcIjAuMC4wLjBcIiA6IFwiMC4wLjAuMFwiLFxyXG4gICAgaG1yOiBtb2JpbGVcclxuICAgICAgICA/IHtcclxuICAgICAgICAgICAgICBwcm90b2NvbDogXCJ3c1wiLFxyXG4gICAgICAgICAgICAgIGhvc3Q6IGF3YWl0IGludGVybmFsSXBWNCgpLFxyXG4gICAgICAgICAgICAgIHBvcnQ6IDE0MjEsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgOiB1bmRlZmluZWQsXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICAgIC8vIDMuIHRlbGwgdml0ZSB0byBpZ25vcmUgd2F0Y2hpbmcgYHNyYy10YXVyaWBcclxuICAgICAgICBpZ25vcmVkOiBbXCIqKi9zcmMtdGF1cmkvKipcIl0sXHJcbiAgICB9LFxyXG4gIH1cclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNOLFNBQVMsb0JBQTZCO0FBQzVQLE9BQU8sV0FBVztBQUNsQixTQUFTLDRCQUE0QjtBQUNyQyxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTSxTQUFTLENBQUMsQ0FBQyxjQUFjLEtBQUssUUFBUSxJQUFJLGtCQUFrQjtBQUdsRSxJQUFPLHNCQUFRLGFBQWEsT0FBTyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQy9DLFNBQVM7QUFBQSxJQUFDLE1BQU07QUFBQSxJQUNoQixxQkFBcUI7QUFBQTtBQUFBLE1BRW5CLFVBQVUsQ0FBQyxLQUFLLFFBQVEsa0NBQVcsb0JBQW9CLENBQUM7QUFBQTtBQUFBLE1BRXhELFVBQVU7QUFBQTtBQUFBLE1BRVYsUUFBUTtBQUFBLE1BQ1IsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLEVBQUU7QUFBQSxFQUdILFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlBLGFBQWE7QUFBQTtBQUFBLEVBRWIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTSxTQUFTLFlBQVk7QUFBQSxJQUMzQixLQUFLLFNBQ0M7QUFBQSxNQUNJLFVBQVU7QUFBQSxNQUNWLE1BQU0sTUFBTSxhQUFhO0FBQUEsTUFDekIsTUFBTTtBQUFBLElBQ1YsSUFDQTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFSCxTQUFTLENBQUMsaUJBQWlCO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
