import Schema from '@utils/Schema';

export const MessageMentions = new Schema({
	id: String,
	username: String,
	discriminator: String,
	avatar: {
		_type: String,
		default: null,
	},
	avatar_decoration: {
		_type: Number,
		nullable: true,
	},
	public_flags: Number,
	member: {
		_type: {
			id: String,
			roles: [String],
			premium_since: {
				_type: String,
				nullable: true,
			},
			pending: Boolean,
			nick: {
				_type: String,
				default: null,
			},
			mute: Boolean,
			joined_at: String,
			flags: Number,
			deaf: Boolean,
			communication_disabled_until: {
				_type: String,
				default: null,
			},
			avatar: {
				_type: String,
				default: null,
			},
		},
		nullable: true,
	},
});