import { SchemaFieldTypes } from 'redis';

import { Redis } from './Redis';

export function createRedisIndexes(client: Redis) {
	client.connection.ft.create('idx:users', {
		'$.id': {
			type: SchemaFieldTypes.TEXT,
			AS: 'id',
		},
		'$.username': {
			type: SchemaFieldTypes.TEXT,
			AS: 'username',
		},
		'$.avatar': {
			type: SchemaFieldTypes.TEXT,
			AS: 'avatar',
		},
		'$.discriminator': {
			type: SchemaFieldTypes.TEXT,
			AS: 'discriminator',
		},
		'$.public_flags': {
			type: SchemaFieldTypes.NUMERIC,
			AS: 'public_flags',
		},
		'$.bot': {
			type: SchemaFieldTypes.TAG,
			AS: 'bot',
		},
		'$.banner': {
			type: SchemaFieldTypes.TEXT,
			AS: 'banner',
		},
		'$.banner_color': {
			type: SchemaFieldTypes.TEXT,
			AS: 'banner_color',
		},
		'$.accent_color': {
			type: SchemaFieldTypes.NUMERIC,
			AS: 'accent_color',
		},
	}, {
		PREFIX: 'users',
		ON: 'JSON',
	});

	client.connection.ft.create('idx:guilds', {
		'$.id': {
			type: SchemaFieldTypes.TEXT,
			AS: 'id',
		},
		'$.name': {
			type: SchemaFieldTypes.TEXT,
			AS: 'name',
		},
		'$.icon': {
			type: SchemaFieldTypes.TEXT,
			AS: 'icon',
		},
		'$.owner_id': {
			type: SchemaFieldTypes.TEXT,
			AS: 'owner_id',
		},
		'$.features': {
			type: SchemaFieldTypes.TAG,
			AS: 'features',
		},
		'$.banner': {
			type: SchemaFieldTypes.TEXT,
			AS: 'banner',
		},
	},{
		PREFIX: 'guilds',
		ON: 'JSON',
	});
}