/** @format */

// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
    // We inferred 2 attributes!
    // Take a look at this schema, and if everything looks good,
    // run `push schema` again to enforce the types.
    entities: {
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
            imageURL: i.string().optional(),
            type: i.string().optional(),
        }),
        didjyahRecords: i.entity({
            createdDate: i.number().indexed().optional(),
            endDate: i.number().optional(),
            inputs: i.string().optional(),
            note: i.string().optional(),
            updatedDate: i.number().optional(),
        }),
        didjyahs: i.entity({
            color: i.string().optional(),
            createdDate: i.number().indexed().optional(),
            dailyGoal: i.number().optional(),
            description: i.string().optional(),
            icon: i.string().optional(),
            iconColor: i.string().optional(),
            inputs: i.any().optional(),
            name: i.string(),
            note: i.boolean().optional(),
            quantity: i.number().optional(),
            sinceLast: i.boolean().optional(),
            stopwatch: i.boolean().optional(),
            timer: i.number().optional(),
            type: i.string().optional(),
            unit: i.string().optional(),
            updatedDate: i.number().optional(),
        }),
        profiles: i.entity({
            firstName: i.string(),
            googlePicture: i.string().optional(),
            joined: i.date(),
            lastName: i.string(),
            plan: i.string(),
        }),
        todos: i.entity({
            createdAt: i.number(),
            done: i.boolean(),
            text: i.string(),
        }),
    },
    links: {
        $usersLinkedPrimaryUser: {
            forward: {
                on: "$users",
                has: "one",
                label: "linkedPrimaryUser",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "linkedGuestUsers",
            },
        },
        didjyahRecordsDidjyah: {
            forward: {
                on: "didjyahRecords",
                has: "one",
                label: "didjyah",
                onDelete: "cascade",
            },
            reverse: {
                on: "didjyahs",
                has: "many",
                label: "records",
            },
        },
        didjyahRecordsOwner: {
            forward: {
                on: "didjyahRecords",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "didjyahRecords",
            },
        },
        didjyahsOwner: {
            forward: {
                on: "didjyahs",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "didjyahs",
            },
        },
        profilesUser: {
            forward: {
                on: "profiles",
                has: "one",
                label: "user",
            },
            reverse: {
                on: "$users",
                has: "one",
                label: "profile",
            },
        },
        todosOwner: {
            forward: {
                on: "todos",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerTodos",
            },
        },
    },
    rooms: {
        todos: {
            presence: i.entity({}),
        },
        didjyahs: {
            presence: i.entity({}),
        },
    },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- re-export pattern for Instant schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
