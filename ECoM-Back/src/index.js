import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`ECoM API ouvindo em http://localhost:${PORT}`);
});