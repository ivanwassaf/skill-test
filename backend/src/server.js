const { app } = require("./app.js");
const { env } = require("./config");
const { blockchainService } = require("./modules/certificates");

const PORT = env.PORT;

// Initialize blockchain service (optional - won't crash if not configured)
blockchainService.initialize().then((initialized) => {
  if (initialized) {
    console.log('🔗 Blockchain service ready');
  } else {
    console.log('ℹ️  Blockchain service not configured (optional feature)');
  }
}).catch(err => {
  console.error('⚠️  Blockchain initialization error:', err.message);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);                                                                                                                                                
});
