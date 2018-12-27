from rest_framework import serializers
from api.common.enums import ErrorCode


class PageQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(
        help_text="Page of filter", default=1, min_value=1
    )
    per_page = serializers.IntegerField(
        default=10, help_text="Per Page of filter", min_value=1, max_value=100
    )


class BadResponseSerializer(serializers.Serializer):
    code = serializers.IntegerField(help_text=ErrorCode.get_info())
    message = serializers.CharField(
        required=False, help_text="Error Messages", allow_blank=True
    )


class ListResponseSerializer(serializers.Serializer):
    total = serializers.IntegerField(
        help_text="Total number of data", min_value=0
    )
