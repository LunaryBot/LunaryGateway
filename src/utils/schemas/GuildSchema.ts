import Schema from '@utils/Schema';
import { ChannelSchema } from './ChannelSchema';

import { RoleSchema } from './RoleSchema';

export const GuildSchema = new Schema({
	id: String,
	name: String,
	icon: { _type: String, nullable: true },
	owner_id: String,
	features: [String],
	banner: {
		_type: String,
		nullable: true,
	},
	roles: [RoleSchema],
	channels: [ChannelSchema],
});