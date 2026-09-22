import NodeCache from "node-cache";

// TTL 60 detik untuk cache list & detail produk
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default cache;
