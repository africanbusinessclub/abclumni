import { useState, useEffect, useCallback } from 'react';
import { platformGateway } from '../../infrastructure/repositories/platformGateway';

type PushState = 'unsupported' | 'denied' | 'granted' | 'subscribed' | 'loading';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [pushState, setPushState] = useState<PushState>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function checkState() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                if (!cancelled) setPushState('unsupported');
                return;
            }

            const permission = Notification.permission;
            if (permission === 'denied') {
                if (!cancelled) setPushState('denied');
                return;
            }

            try {
                const reg = await navigator.serviceWorker.ready;
                const existingSub = await reg.pushManager.getSubscription();
                if (!cancelled) {
                    setPushState(existingSub ? 'subscribed' : 'granted');
                }
            } catch {
                if (!cancelled) setPushState('unsupported');
            }
        }

        checkState();
        return () => { cancelled = true; };
    }, []);

    const subscribe = useCallback(async () => {
        try {
            setError('');
            setPushState('loading');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setPushState('denied');
                return false;
            }

            // Fetch VAPID public key from backend
            let publicKey: string;
            try {
                const res = await platformGateway.getVapidPublicKey();
                publicKey = res.data.publicKey;
            } catch {
                setError('Push notifications not configured on server');
                setPushState('unsupported');
                return false;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            });

            // Send subscription to backend
            await platformGateway.subscribePush({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
                },
                device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            });

            setPushState('subscribed');
            return true;
        } catch (err) {
            console.error('Push subscription failed:', err);
            setError('Échec de l\'activation des notifications');
            setPushState('denied');
            return false;
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        try {
            setError('');

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await platformGateway.unsubscribePush({ endpoint: sub.endpoint });
                await sub.unsubscribe();
            }

            setPushState('granted');
            return true;
        } catch (err) {
            console.error('Push unsubscribe failed:', err);
            setError('Échec de la désactivation des notifications');
            return false;
        }
    }, []);

    return { pushState, error, subscribe, unsubscribe };
}
