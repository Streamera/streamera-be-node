export default [
    {
        name: "initial_migration",
        query: `
            CREATE TABLE migrations (
                id serial PRIMARY KEY,
                name text UNIQUE not null,
                migration_group int not null,
                migrated_at timestamp not null
            );`,
        rollback_query: `DROP TABLE migrations;`
    },
    {
        // https://stackoverflow.com/questions/9556474/how-do-i-automatically-update-a-timestamp-in-postgresql
        name: "create_updated_at_function",
        query: `
                CREATE OR REPLACE FUNCTION update_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
                    NEW.updated_at = now();
                    RETURN NEW;
                ELSE
                    RETURN OLD;
                END IF;
                END;
                $$ language 'plpgsql';
            `,
        rollback_query: `
            DROP FUNCTION update_at_column;
        `
    },
    {
        name: "create_users_table",
        query: `
            CREATE TYPE user_status AS ENUM ('active', 'inactive');

            CREATE TABLE users (
                id serial PRIMARY KEY,
                name text not null default '',
                display_name text not null default '',
                wallet text not null,
                signature text not null default '',
                profile_picture text not null default '',
                status user_status default 'active',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE users;
            DROP TYPE user_status;
        `
    },
    {
        name: "create_users_table_idx",
        query: `
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX users_wallet_idx ON users (wallet);
            `,
        rollback_query: `
            DROP TRIGGER update_users_updated_at;
            DROP INDEX users_wallet_idx;
        `
    },
    {
        name: "create_user_donation_setting_table",
        query: `
            CREATE TABLE user_donation_setting (
                id serial PRIMARY KEY,
                user_id int not null,
                to_chain text default 0,
                to_token_symbol text not null default '',
                to_token_address text not null default '',
                quick_amount text not null default '[3, 10, 25, 50]',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `DROP TABLE user_donation_setting;`
    },
    {
        name: "create_user_donation_setting_table_idx",
        query: `
            CREATE TRIGGER update_user_donation_setting_updated_at BEFORE UPDATE ON user_donation_setting FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            `,
        rollback_query: `
            DROP TRIGGER update_user_donation_setting_updated_at;
            `
    },
    {
        name: "create_user_donation_setting_unique_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY user_donation_setting_user_id_idx ON user_donation_setting (user_id);
            `,
        rollback_query: `
            DROP INDEX user_donation_setting_user_id_idx;
            `
    },
    {
        name: "create_user_social_media_table",
        query: `
            CREATE TYPE social_media_type AS ENUM ('twitch', 'discord', 'youtube', 'instagram', 'tiktok', 'twitter', 'facebook', 'email');

            CREATE TABLE user_social_media (
                id serial PRIMARY KEY,
                user_id int not null,
                type social_media_type not null,
                url text not null default '',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE user_social_media;
            DROP TYPE social_media_type;
        `
    },
    {
        name: "create_user_social_media_idx",
        query: `
            CREATE TRIGGER update_user_social_media_updated_at BEFORE UPDATE ON user_social_media FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX user_social_media_user_id_idx ON user_social_media (user_id);
            `,
        rollback_query: `
            DROP TRIGGER update_user_social_media_updated_at;
            DROP INDEX user_social_media_user_id_idx;

        `
    },
    {
        name: "create_streams_table",
        query: `
            CREATE TYPE stream_status AS ENUM ('live', 'ended', 'scheduled');

            CREATE TABLE streams (
                id serial PRIMARY KEY,
                user_id int not null,
                title text not null default '',
                description text not null default '',
                thumbnail text not null default '',
                start_at timestamp,
                end_at timestamp,
                status stream_status default 'scheduled',
                created_at timestamp default current_timestamp,
                updated_at timestamp,
                deleted_at timestamp
            );`,
        rollback_query: `
            DROP TABLE streams;
            DROP TYPE stream_status;
        `
    },
    {
        name: "create_streams_table_idx",
        query: `
            CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX streams_user_id_status_idx ON streams (status);
            CREATE INDEX streams_user_id_idx ON streams (user_id);
            `,
        rollback_query: `
            DROP TRIGGER update_streams_updated_at;
            DROP INDEX streams_user_id_status_idx;
            DROP INDEX streams_user_id_idx;
            `
        },
    {
        name: "create_stream_payments_table",
        query: `
            CREATE TYPE stream_payment_status AS ENUM ('pending', 'success', 'failed');

            CREATE TABLE stream_payments (
                id bigserial PRIMARY KEY,
                from_user int,
                from_wallet text not null,
                from_chain int not null,
                from_token_symbol text not null,
                from_token_address text not null,
                from_amount numeric(72,18) not null,
                to_user int not null,
                to_wallet text not null,
                to_chain int not null,
                to_token_symbol text not null,
                to_token_address text not null,
                to_amount numeric(72,18) not null,
                tx_hash text not null,
                usd_worth numeric(18,2) not null,
                status stream_payment_status not null default 'pending',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_payments;
            DROP TYPE stream_payment_status;
        `
    },
    {
        name: "create_stream_payments_idx",
        query: `
            CREATE TRIGGER update_stream_payments_updated_at BEFORE UPDATE ON stream_payments FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_payments_status_idx ON stream_payments (status);
            CREATE INDEX stream_payments_from_user_idx ON stream_payments (from_user);
            CREATE INDEX stream_payments_to_user_idx ON stream_payments (to_user);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_payments_updated_at;
            DROP INDEX stream_payments_status_idx;
            DROP INDEX stream_payments_from_user_idx;
            DROP INDEX stream_payments_to_user_idx;
            `
    },
    {
        name: "create_stream_payments_unique_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY stream_payments_tx_hash_idx ON stream_payments (tx_hash);
            `,
        rollback_query: `
            DROP INDEX stream_payments_tx_hash_idx;
            `
    },
    {
        name: "create_overlay_styles_table",
        query: `
            CREATE TYPE overlay_position AS ENUM ('top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right');

            CREATE TABLE overlay_styles (
                id serial PRIMARY KEY,
                font_type text not null default '',
                font_size text not null default '',
                font_color text not null default '',
                bg_color text not null default '',
                bg_image text not null default '',
                bar_empty_color text not null default '',
                bar_filled_color text not null default '',
                position overlay_position not null default 'middle-center',
                theme text not null default 'none',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE overlay_styles;
            DROP TYPE overlay_position;
        `
    },
    {
        name: "create_overlay_styles_trigger",
        query: `
            CREATE TRIGGER update_overlay_styles_updated_at BEFORE UPDATE ON overlay_styles FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            `,
        rollback_query: `
            DROP TRIGGER update_overlay_styles_updated_at;
        `
    },
    {
        name: "create_stream_polls_table",
        query: `
            CREATE TYPE poll_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_polls (
                id bigserial PRIMARY KEY,
                user_id int not null,
                title text not null default '',
                start_at timestamp,
                end_at timestamp,
                status poll_status default 'inactive',
                style_id int not null default 0,
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_polls;
        `
    },
    {
        name: "create_stream_polls_idx",
        query: `
            CREATE TRIGGER update_stream_polls_updated_at BEFORE UPDATE ON stream_polls FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            `,
        rollback_query: `
            DROP TRIGGER update_stream_polls_updated_at;
        `
    },
    {
        name: "create_stream_polls_unique_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY stream_polls_user_id_idx ON stream_polls (user_id);
            `,
        rollback_query: `
            DROP INDEX stream_polls_user_id_idx;
        `
    },
    {
        name: "create_stream_poll_options_table",
        query: `
            CREATE TABLE stream_poll_options (
                id bigserial PRIMARY KEY,
                poll_id bigint not null,
                option text not null default '',
                created_at timestamp default current_timestamp,
                updated_at timestamp,
                deleted_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_poll_options;
        `
    },
    {
        name: "create_stream_poll_options_idx",
        query: `
            CREATE TRIGGER update_stream_poll_options_updated_at BEFORE UPDATE ON stream_poll_options FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_poll_options_poll_id_idx ON stream_poll_options (poll_id);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_poll_options_updated_at;
            DROP INDEX stream_poll_options_poll_id_idx;
        `
    },
    {
        name: "create_stream_poll_payments_table",
        query: `
            CREATE TABLE stream_poll_payments (
                poll_id int not null,
                option_id bigint not null,
                payment_id bigint not null
            );`,
        rollback_query: `
            DROP TABLE stream_poll_payments;
        `
    },
    {
        name: "create_stream_poll_payments_table_idx",
        query: `
            CREATE INDEX stream_poll_payments_poll_id_option_id_idx ON stream_poll_payments (poll_id, option_id);
            `,
        rollback_query: `
            DROP INDEX stream_poll_payments_poll_id_option_id_idx;
        `
    },
    {
        name: "create_stream_milestone_table",
        query: `
            CREATE TYPE milestone_timeframe AS ENUM ('monthly', 'weekly', 'daily');
            CREATE TYPE milestone_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_milestones (
                id bigserial PRIMARY KEY,
                user_id int not null,
                title text not null default '',
                target numeric(18, 2) not null,
                style_id int not null default 0,
                start_at timestamp,
                end_at timestamp,
                status milestone_status default 'inactive',
                timeframe milestone_timeframe not null default 'weekly',
                created_at timestamp default current_timestamp,
                updated_at timestamp,
                deleted_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_milestones;
        `
    },
    {
        name: "create_stream_milestone_table_idx",
        query: `
            CREATE TRIGGER update_stream_milestones_updated_at BEFORE UPDATE ON stream_milestones FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_milestone_user_id_idx ON stream_milestones (user_id);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_milestones_updated_at;
            DROP INDEX stream_milestone_user_id_idx;
        `
    },
    // {
    //     name: "create_stream_milestone_payment_table",
    //     query: `
    //         CREATE TABLE stream_milestone_payments (
    //             milestone_id bigint not null,
    //             payment_id bigint not null
    //         );`,
    //     rollback_query: `
    //         DROP TABLE stream_milestone;
    //     `
    // },
    // {
    //     name: "create_stream_milestone_payments_table_idx",
    //     query: `
    //         CREATE INDEX stream_milestone_payments_milestone_id_idx ON stream_milestone_payments (milestone_id);
    //         `,
    //     rollback_query: `
    //         DROP INDEX stream_milestone_payments_milestone_id_idx;
    //     `
    // },
    {
        name: "create_stream_leaderboard_table",
        query: `
            CREATE TYPE leaderboard_timeframe AS ENUM ('monthly', 'weekly', 'daily');
            CREATE TYPE leaderboard_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_leaderboards (
                id serial PRIMARY KEY,
                user_id int not null,
                title text not null default '',
                style_id int not null default 0,
                status leaderboard_status default 'inactive',
                timeframe leaderboard_timeframe not null default 'weekly',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_leaderboards;
        `
    },
    {
        name: "create_stream_leaderboard_table_idx",
        query: `
            CREATE TRIGGER update_stream_leaderboards_updated_at BEFORE UPDATE ON stream_leaderboards FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_leaderboard_status_idx ON stream_leaderboards (status);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_leaderboards_updated_at;
            DROP INDEX stream_leaderboard_status_idx;
        `
    },
    {
        name: "create_stream_leaderboard_concurrently_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY stream_leaderboard_user_id_idx ON stream_leaderboards (user_id);
            `,
        rollback_query: `
            DROP INDEX stream_leaderboard_user_id_idx;
        `
    },
    // {
    //     name: "create_stream_leaderboard_payments_table",
    //     query: `
    //         CREATE TABLE stream_leaderboard_payments (
    //             leaderboard_id bigint not null,
    //             payment_id bigint not null
    //         );`,
    //     rollback_query: `
    //         DROP TABLE stream_leaderboard_payments;
    //     `
    // },
    {
        name: "create_stream_trigger_table",
        query: `
            CREATE TYPE trigger_type AS ENUM ('alltime', 'milestone', 'poll');
            CREATE TYPE trigger_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_triggers (
                id serial PRIMARY KEY,
                user_id int not null,
                style_id int not null default 0,
                content text not null default '',
                caption text not null default '{{donator}}: {{amount}}',
                type trigger_type default 'alltime',
                status trigger_status default 'inactive',
                created_at timestamp default current_timestamp,
                updated_at timestamp,
                deleted_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_triggers;
        `
    },
    {
        name: "create_stream_triggers_table_idx",
        query: `
            CREATE TRIGGER update_stream_triggers_updated_at BEFORE UPDATE ON stream_triggers FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_triggers_user_id_idx ON stream_triggers (user_id);
            CREATE INDEX stream_triggers_status_idx ON stream_triggers (status);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_triggers_updated_at;
            DROP INDEX stream_triggers_user_id_idx;
            DROP INDEX stream_triggers_status_idx;
        `
    },
    {
        name: "create_stream_announcements_table",
        query: `
            CREATE TYPE announcement_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_announcements (
                id serial PRIMARY KEY,
                user_id int not null,
                style_id int not null default 0,
                content text not null default '',
                speed int not null default 500,
                start_at timestamp ,
                end_at timestamp,
                status announcement_status default 'inactive',
                created_at timestamp default current_timestamp,
                updated_at timestamp,
                deleted_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_announcements;
        `
    },
    {
        name: "create_stream_announcements_table_idx",
        query: `
            CREATE TRIGGER update_stream_announcements_updated_at BEFORE UPDATE ON stream_announcements FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_announcements_status_idx ON stream_announcements (status);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_announcements_updated_at;
            DROP INDEX stream_announcements_status_idx;
        `
    },
    {
        name: "create_stream_announcements_unique_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY stream_announcements_user_id_idx ON stream_announcements (user_id);
            `,
        rollback_query: `
            DROP INDEX stream_announcements_user_id_idx;
        `
    },
    {
        name: "create_stream_qr_table",
        query: `
            CREATE TYPE qr_status AS ENUM ('active', 'inactive');

            CREATE TABLE stream_qr (
                id serial PRIMARY KEY,
                user_id int not null,
                qr text not null,
                style_id int not null default 0,
                status qr_status default 'inactive',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_qr;
        `
    },
    {
        name: "create_stream_qr_table_idx",
        query: `
            CREATE TRIGGER update_stream_qr_updated_at BEFORE UPDATE ON stream_qr FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_qr_status_idx ON stream_qr (status);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_qr_updated_at;
            DROP INDEX stream_qr_status_idx;
        `
    },
    {
        name: "create_stream_qr_concurrently_idx",
        query: `
            CREATE UNIQUE INDEX CONCURRENTLY stream_qr_user_id_idx ON stream_qr (user_id);
            `,
        rollback_query: `
            DROP INDEX stream_qr_user_id_idx;
        `
    },
    {
        name: "create_stream_webhooks_table",
        query: `
            CREATE TYPE webhook_status AS ENUM ('active', 'inactive');
            CREATE TYPE webhook_type AS ENUM ('discord', 'custom');

            CREATE TABLE stream_webhooks (
                id serial PRIMARY KEY,
                user_id int not null,
                type webhook_type not null,
                value text not null,
                template text not null,
                status webhook_status default 'inactive',
                created_at timestamp default current_timestamp,
                updated_at timestamp
            );`,
        rollback_query: `
            DROP TABLE stream_webhooks;
        `
    },
    {
        name: "create_stream_webhooks_idx",
        query: `
            CREATE TRIGGER update_stream_webhooks_updated_at BEFORE UPDATE ON stream_webhooks FOR EACH ROW EXECUTE PROCEDURE update_at_column();
            CREATE INDEX stream_webhook_type_idx ON stream_webhooks (type);
            CREATE INDEX stream_webhook_status_idx ON stream_webhooks (status);
            `,
        rollback_query: `
            DROP TRIGGER update_stream_webhooks_updated_at;
            DROP INDEX stream_webhook_type_idx;
            DROP INDEX stream_webhook_status_idx;
        `
    },
    {
        name: "create_stream_webhooks_concurrently_idx",
        query: `
            CREATE INDEX CONCURRENTLY stream_webhooks_user_id_idx ON stream_webhooks (user_id);
            `,
        rollback_query: `
            DROP INDEX stream_webhooks_user_id_idx;
        `
    },
];