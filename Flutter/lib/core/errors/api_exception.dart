class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.body});
  final String message;
  final int? statusCode;
  final dynamic body;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
