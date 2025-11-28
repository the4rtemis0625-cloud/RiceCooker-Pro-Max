import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// This is a typed event emitter. It helps ensure that we're only emitting and listening for events that we've defined.
class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  private emitter = new EventEmitter();

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    this.emitter.emit(event as string, ...args);
  }

  on<K extends keyof T>(event: K, listener: T[K]) {
    this.emitter.on(event as string, listener);
  }

  off<K extends keyof T>(event: K, listener: T[K]) {
    this.emitter.off(event as string, listener);
  }
}

// We create a single, global instance of our typed event emitter.
export const errorEmitter = new TypedEventEmitter<AppEvents>();
