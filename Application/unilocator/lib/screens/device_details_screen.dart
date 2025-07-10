import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../main.dart'; // Import LoggedElevatedButton from main.dart

class DeviceDetailsScreen extends StatelessWidget {
  const DeviceDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final deviceId = ModalRoute.of(context)?.settings.arguments as String?;
    AppLogger.logGlobal(
      'Device details screen loaded for device: $deviceId',
      type: LogType.info,
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Device Details')),
      body: Consumer<DeviceProvider>(
        builder: (context, deviceProvider, _) {
          if (deviceId == null) {
            AppLogger.logGlobal(
              'Device details: No device ID provided',
              type: LogType.warning,
            );
            return const Center(child: Text('No device selected.'));
          }
          final device = deviceProvider.getDeviceById(deviceId);
          if (deviceProvider.isLoadingDevice) {
            AppLogger.logGlobal(
              'Loading device details for: $deviceId',
              type: LogType.info,
            );
            return const Center(child: CircularProgressIndicator());
          }
          if (device == null) {
            AppLogger.logGlobal(
              'Device not found: $deviceId',
              type: LogType.error,
            );
            return const Center(child: Text('Device not found.'));
          }
          AppLogger.logGlobal(
            'Device details loaded successfully for: ${device.name} (${device.id})',
            type: LogType.success,
          );
          return Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  device.name ?? 'Unknown Device',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                Text('ID: ${device.id}'),
                const SizedBox(height: 8),
                Text('Battery: ${device.battery ?? 'N/A'}'),
                const SizedBox(height: 8),
                Text('Network: ${device.network ?? 'N/A'}'),
                const SizedBox(height: 8),
                Text('Location: ${device.location ?? 'N/A'}'),
                const SizedBox(height: 24),
                Center(
                  child: Icon(
                    Icons.map,
                    size: 120,
                    color: const Color(0xFF037d3a),
                  ),
                ),
                const SizedBox(height: 24),
                Center(
                  child: LoggedElevatedButton(
                    onPressed: () {
                      AppLogger.logGlobal(
                        'Location history button pressed for device: $deviceId',
                        type: LogType.info,
                      );
                      // TODO: Implement location history navigation
                    },
                    logMessage:
                        'View Location History button pressed for device $deviceId',
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.history),
                        SizedBox(width: 8),
                        Text('View Location History'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
