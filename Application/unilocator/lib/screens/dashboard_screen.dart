import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../main.dart'; // Import LoggedElevatedButton and LoggedTextButton from main.dart

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('UniLocator'),
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle),
            onPressed: () {
              AppLogger.logGlobal('Account button pressed', type: LogType.info);
              // TODO: Navigate to account/profile screen
            },
          ),
        ],
      ),
      body: Consumer<DeviceProvider>(
        builder: (context, deviceProvider, _) {
          if (deviceProvider.isLoadingDevices) {
            return const Center(child: CircularProgressIndicator());
          }
          final devices = deviceProvider.devices;
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'My Devices',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    LoggedElevatedButton(
                      onPressed: () {
                        // TODO: Navigate to add device screen
                      },
                      logMessage: 'Add New Device button pressed',
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add),
                          SizedBox(width: 8),
                          Text('Add New Device'),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: devices.isEmpty
                      ? const Center(child: Text('No devices found.'))
                      : GridView.builder(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                                childAspectRatio: 1.2,
                              ),
                          itemCount: devices.length,
                          itemBuilder: (context, index) {
                            final device = devices[index];
                            return Card(
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          device.name ?? 'Device',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Icon(
                                          Icons.more_vert,
                                          color: Colors.white70,
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'ID: ${device.id}',
                                      style: const TextStyle(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Connected: --',
                                      style: const TextStyle(
                                        color: Colors.grey,
                                      ),
                                    ),
                                    const Spacer(),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.battery_full,
                                          color: Color(0xFF037d3a),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Battery: ${device.battery ?? 'N/A'}',
                                        ),
                                      ],
                                    ),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.wifi,
                                          color: Color(0xFF037d3a),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Network: ${device.network ?? 'N/A'}',
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Align(
                                      alignment: Alignment.bottomRight,
                                      child: LoggedTextButton(
                                        onPressed: () {
                                          AppLogger.logGlobal(
                                            'Device track button pressed for device: ${device.id}',
                                            type: LogType.info,
                                          );
                                          Navigator.pushNamed(
                                            context,
                                            '/device',
                                            arguments: device.id,
                                          );
                                        },
                                        logMessage:
                                            'Track button pressed for device ${device.id}',
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.map,
                                              color: Color(0xFF037d3a),
                                            ),
                                            SizedBox(width: 8),
                                            Text('Track'),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
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
