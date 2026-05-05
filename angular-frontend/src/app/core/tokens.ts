import { InjectionToken } from '@angular/core';
import { HttpContextToken } from '@angular/common/http';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);
export const SKIP_SUCCESS_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_RETRY = new HttpContextToken<boolean>(() => false);
