import Schema from '@utils/Schema';

export const RoleSchema = new Schema({
	id: String,
	name: String,
	permissions: {
		_type: Number,
		middleware: Number,
	},
	position: { _type: Number, nullable: true },
	color: Number,
	hoist: Boolean,
	managed: Boolean,
	mentionable: Boolean,
});