const watchPartySchema = new mongoose.Schema({
  name: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const WatchParty = mongoose.model('WatchParty', watchPartySchema);
