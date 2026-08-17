import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface RealtimeEvent { target: string; arguments: unknown[]; }

@Injectable({ providedIn: 'root' })
export class TaskHubService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private socket?: WebSocket;
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly eventSubject = new Subject<RealtimeEvent>();
  readonly connected$ = this.connectedSubject.asObservable();
  readonly events$ = this.eventSubject.asObservable();

  constructor(private readonly auth: AuthService) {}

  connect(): void {
    if (!this.browser || this.socket || !this.auth.getToken()) return;
    const token = this.auth.getToken();
    if (!token) return;
    const url = `${environment.hubUrl}?access_token=${encodeURIComponent(token)}`.replace(/^http/, 'ws').replace(/^https/, 'wss');
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      this.connectedSubject.next(true);
      socket.send(JSON.stringify({ protocol: 'json', version: 1 }) + '\u001e');
    };
    socket.onmessage = event => this.handleMessage(String(event.data));
    socket.onerror = () => this.connectedSubject.next(false);
    socket.onclose = () => {
      this.connectedSubject.next(false);
      this.socket = undefined;
    };
  }

  joinProject(projectId: string): void { this.invoke('JoinProject', [projectId]); }
  leaveProject(projectId: string): void { this.invoke('LeaveProject', [projectId]); }
  disconnect(): void { this.socket?.close(); this.socket = undefined; this.connectedSubject.next(false); }

  private invoke(target: string, args: unknown[]): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 1, invocationId: crypto.randomUUID(), target, arguments: args }) + '\u001e');
  }

  private handleMessage(payload: string): void {
    for (const record of payload.split('\u001e')) {
      if (!record) continue;
      try {
        const message = JSON.parse(record) as { type?: number; target?: string; arguments?: unknown[] };
        if (message.type === 1 && message.target) {
          this.eventSubject.next({ target: message.target, arguments: message.arguments ?? [] });
        }
      } catch {
        // Ignore malformed frames; SignalR frames are delimited by U+001E.
      }
    }
  }
}
