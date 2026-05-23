"""Official Python SDK for the Comet AI platform.

Example
-------
>>> from cometai import CometClient
>>> client = CometClient(api_key="sk-...", base_url="https://your-gateway.example.com/v1")
>>> reply = client.chat.complete(
...     model="chat-basic",
...     messages=[{"role": "user", "content": "你好"}],
... )
>>> print(reply["choices"][0]["message"]["content"])
"""

from cometai.client import (
    CometClient,
    CometError,
    ModerationResult,
    ChatCompletion,
)

__all__ = ["CometClient", "CometError", "ModerationResult", "ChatCompletion"]
__version__ = "0.1.0"
