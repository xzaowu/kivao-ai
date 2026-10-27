import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AssetReference, CreationPlan } from '@kivao/contracts';

export const scenes = pgTable('scenes', {
  id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull(),
  requiredRoles: text('required_roles').array().notNull(), outputKind: text('output_kind').notNull(),
});
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(), kind: text('kind').notNull(),
  allowedRoles: text('allowed_roles').array().notNull(), source: text('source').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const plans = pgTable('creation_plans', {
  id: uuid('id').primaryKey().defaultRandom(), sceneId: text('scene_id').notNull().references(() => scenes.id),
  prompt: text('prompt').notNull(), assets: jsonb('assets').$type<AssetReference[]>().notNull(),
  estimate: jsonb('estimate').$type<CreationPlan['estimate']>().notNull(), status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const creations = pgTable('creations', {
  id: uuid('id').primaryKey().defaultRandom(), sceneId: text('scene_id').notNull().references(() => scenes.id),
  planId: uuid('plan_id').notNull().unique().references(() => plans.id), status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(), creationId: uuid('creation_id').notNull().references(() => creations.id),
  status: text('status').notNull(), progress: integer('progress').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const versions = pgTable('versions', {
  id: uuid('id').primaryKey().defaultRandom(), creationId: uuid('creation_id').notNull().references(() => creations.id),
  taskId: uuid('task_id').notNull().unique().references(() => tasks.id), ordinal: integer('ordinal').notNull(),
  kind: text('kind').notNull(), label: text('label').notNull(), artifactUrl: text('artifact_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const works = pgTable('works', {
  id: uuid('id').primaryKey().defaultRandom(), creationId: uuid('creation_id').notNull().references(() => creations.id),
  versionId: uuid('version_id').notNull().references(() => versions.id), title: text('title').notNull(),
  savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
});
