import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { string } from "rollup-plugin-string";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    string({
      include: [
        "./WebAtlas_EuroSiS.gexf",
        "./sp_data_school_day_2_g.gexf_",
        "./got-network.graphml",
      ],
    }),
  ],
});
