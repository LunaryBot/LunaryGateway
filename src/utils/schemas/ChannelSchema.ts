import Schema from '@utils/Schema';

export const ChannelSchema = new Schema({
	id: String,
	name: String,
	type: Number,
	nsfw: Boolean,
	parent_id: {
		_type: Number,
		default: null,
	},
	position: Number,
});