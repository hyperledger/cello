
from flask import request,json
from werkzeug.exceptions import HTTPException

class ApiException(HTTPException):
    code = 500
    error_code = 500
    msg = 'sorry, made a mistake'

    def __init__(self,code=None, error_code=None, msg=None, header=None):
        if code:
            self.code = code
        if msg:
            self.msg = msg
        if error_code:
            self.error_code = error_code
        super(ApiException,self).__init__(msg,None)

    def get_body(self, environ=None):
        body=dict(
            msg=self.msg,
            error_code = self.error_code,
            request=request.method + ' ' + self.get_url_no_param()
        )
        text = json.dumps(body)
        return text

    def get_headers(self, environ=None):
        return [('Content-Type','application/json')]

    @staticmethod
    def get_url_no_param():
        full_url = str(request.full_path)
        main_path = full_url.split('?')
        return main_path[0]

class ParameterException(ApiException):
    code = 400
    error_code = 400
    msg = 'invalid parameter'

class BadRequest(ApiException):

    """*400* `Bad Request`

    Raise if the browser sends something to the application the application
    or server cannot handle.
    """
    code = 400
    error_code = 400
    msg = 'The browser (or proxy) sent a request that this server could not understand.'

class Success(ApiException):
    code = 200
    msg = 'success'

class ClientDisconnected(BadRequest):

    """Internal exception that is raised if Werkzeug detects a disconnected
    client.  Since the client is already gone at that point attempting to
    send the error message to the client might not work and might ultimately
    result in another exception in the server.  Mainly this is here so that
    it is silenced by default as far as Werkzeug is concerned.

    Since disconnections cannot be reliably detected and are unspecified
    by WSGI to a large extent this might or might not be raised if a client
    is gone.

    .. versionadded:: 0.8
    """


class SecurityError(BadRequest):

    """Raised if something triggers a security error.  This is otherwise
    exactly like a bad request error.

    .. versionadded:: 0.9
    """


class BadHost(BadRequest):

    """Raised if the submitted host is badly formatted.

    .. versionadded:: 0.11.2
    """


class Unauthorized(ApiException):

    """*401* `Unauthorized`

    Raise if the user is not authorized.  Also used if you want to use HTTP
    basic auth.
    """
    code = 401
    error_code = 401
    msg = (
        'The server could not verify that you are authorized to access '
        'the URL requested.  You either supplied the wrong credentials (e.g. '
        'a bad password), or your browser doesn\'t understand how to supply '
        'the credentials required.'
    )


class Forbidden(ApiException):

    """*403* `Forbidden`

    Raise if the user doesn't have the permission for the requested resource
    but was authenticated.
    """
    code = 403
    error_code = 403
    msg = (
        'You don\'t have the permission to access the requested resource. '
        'It is either read-protected or not readable by the server.'
    )


class NotFound(ApiException):

    """*404* `Not Found`

    Raise if a resource does not exist and never existed.
    """
    code = 404
    error_code = 404
    msg = (
        'The requested URL was not found on the server.  '
        'If you entered the URL manually please check your spelling and '
        'try again.'
    )


class MethodNotAllowed(ApiException):

    """*405* `Method Not Allowed`

    Raise if the server used a method the resource does not handle.  For
    example `POST` if the resource is view only.  Especially useful for REST.

    The first argument for this exception should be a list of allowed methods.
    Strictly speaking the response would be invalid if you don't provide valid
    methods in the header which you can do with that list.
    """
    code = 405
    error_code = 405
    msg = 'The method is not allowed for the requested URL.'

    def __init__(self, valid_methods=None, msg=None):
        """Takes an optional list of valid http methods
        starting with werkzeug 0.3 the list will be mandatory."""
        ApiException.__init__(self, msg)
        self.valid_methods = valid_methods

    def get_headers(self, environ):
        headers = ApiException.get_headers(self, environ)
        if self.valid_methods:
            headers.append(('Allow', ', '.join(self.valid_methods)))
        return headers


class NotAcceptable(ApiException):

    """*406* `Not Acceptable`

    Raise if the server can't return any content conforming to the
    `Accept` headers of the client.
    """
    code = 406
    error_code = 406

    msg = (
        'The resource identified by the request is only capable of '
        'generating response entities which have content characteristics '
        'not acceptable according to the accept headers sent in the '
        'request.'
    )


class RequestTimeout(ApiException):

    """*408* `Request Timeout`

    Raise to signalize a timeout.
    """
    code = 408
    error_code = 408
    msg = (
        'The server closed the network connection because the browser '
        'didn\'t finish the request within the specified time.'
    )

class UnsupportedMediaType(ApiException):
    """*415* `Unsupported Media Type`

        The status code returned if the server is unable to handle the media type
        the client transmitted.
        """
    code = 415
    error_code = 415
    description = (
        'The server does not support the media type transmitted in '
        'the request.'
    )

class InternalServerError(ApiException):

    """*500* `Internal Server Error`

    Raise if an internal server error occurred.  This is a good fallback if an
    unknown error occurred in the dispatcher.
    """
    code = 500
    error_code = 500
    description = (
        'The server encountered an internal error and was unable to '
        'complete your request.  Either the server is overloaded or there '
        'is an error in the application.'
    )