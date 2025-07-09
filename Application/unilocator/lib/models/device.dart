class Device {
  final String id;
  final String? name;
  final String? battery;
  final String? network;
  final String? location;

  Device({
    required this.id,
    this.name,
    this.battery,
    this.network,
    this.location,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'].toString(),
      name: json['name'],
      battery: json['battery']?.toString(),
      network: json['network']?.toString(),
      location: json['location']?.toString(),
    );
  }
}
