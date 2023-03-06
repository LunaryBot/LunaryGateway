import { SchemaType } from '@utils/Schema';
import { MessageMentions } from './MessageMentions';

export const MessageBase: SchemaType = {
	id: String,
	type: Number,
	tts: Boolean,
	timestamp: String,
	pinned: Boolean,
	mentions: [MessageMentions],
	mention_roles: [String],
	mention_everyone: Boolean,
	flags: Number,
	embeds: [],
	edited_timestamp: {
		_type: String,
		default: null,
	},
	content: String,
	components: [],
	attachments: [],
	guild_id: String,
	author_id: String,
};