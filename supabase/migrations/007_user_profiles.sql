-- Migration 007 - Add profile fields to users

ALTER TABLE public.users
ADD COLUMN name text,
ADD COLUMN x_handle text;
