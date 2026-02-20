import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Device } from '@capacitor/device';

async function initNative() {
    try {
        const info = await Device.getInfo();
        if (info.platform === 'web') {
            console.log('Running on Web, skipping native initialization');
            return;
        }

        console.log('Initializing Native Features for platform:', info.platform);

        await SplashScreen.hide();

        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });

        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
            await PushNotifications.register();
        }

        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });

    } catch (e) {
        console.error('Failed to initialize native features', e);
    }
}

document.addEventListener('DOMContentLoaded', initNative);
