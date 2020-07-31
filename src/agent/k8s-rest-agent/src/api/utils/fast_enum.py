import re
from functools import partial
from typing import (
    Any,
    Text,
    Dict,
    List,
    Tuple,
    Type,
    Optional,
    Callable,
    Iterable,
)


def _resolve_init(bases: Tuple[Type]) -> Optional[Callable]:
    for bcls in bases:
        for rcls in bcls.mro():
            resolved_init = getattr(rcls, "__init__")
            if resolved_init and resolved_init is not object.__init__:
                return resolved_init


def _resolve_new(bases: Tuple[Type]) -> Optional[Tuple[Callable, Type]]:
    for bcls in bases:
        new = getattr(bcls, "__new__", None)
        if new not in {
            None,
            None.__new__,
            object.__new__,
            FastEnum.__new__,
            getattr(FastEnum, "_FastEnum__new"),
        }:
            return new, bcls


class FastEnum(type):
    """
    A metaclass that handles enum-classes creation.
    Possible options for classes using this metaclass:
    - auto-generated values (see examples.py `MixedEnum` and `LightEnum`)
    - subclassing possible until actual enum is not declared
     (see examples.py `ExtEnumOne` and `ExtEnumTwo`)
    - late init hooking (see examples.py `HookedEnum`)
    - enum modifications protection (see examples.py comment after `ExtendedEnum`)
    """

    # pylint: disable=bad-mcs-classmethod-argument,protected-access,too-many-locals
    # pylint: disable=too-many-branches
    def __new__(mcs, name, bases, namespace: Dict[Text, Any]):
        attributes: List[Text] = [
            k
            for k in namespace.keys()
            if (not k.startswith("_") and k.isupper())
        ]
        attributes += [
            k
            for k, v in namespace.get("__annotations__", {}).items()
            if (not k.startswith("_") and k.isupper() and v == name)
        ]
        light_val = 0 + int(not bool(namespace.get("_ZERO_VALUED")))
        for attr in attributes:
            if attr in namespace:
                continue
            else:
                namespace[attr] = light_val
                light_val += 1

        __itemsize__ = 0
        for bcls in bases:
            if bcls is type:
                continue
            __itemsize__ = max(__itemsize__, bcls.__itemsize__)

        if not __itemsize__:
            __slots__ = set(namespace.get("__slots__", tuple())) | {
                "name",
                "value",
                "_value_to_instance_map",
                "_base_typed",
            }
            namespace["__slots__"] = tuple(__slots__)
        namespace["__new__"] = FastEnum.__new

        if "__init__" not in namespace:
            namespace["__init__"] = _resolve_init(bases) or mcs.__init
        if "__annotations__" not in namespace:
            __annotations__ = dict(name=Text, value=Any)
            for k in attributes:
                __annotations__[k] = name
            namespace["__annotations__"] = __annotations__
        namespace["__dir__"] = partial(
            FastEnum.__dir, bases=bases, namespace=namespace
        )
        typ = type.__new__(mcs, name, bases, namespace)
        if attributes:
            typ._value_to_instance_map = {}
            for instance_name in attributes:
                val = namespace[instance_name]
                if not isinstance(val, tuple):
                    val = (val,)
                if val[0] in typ._value_to_instance_map:
                    inst = typ._value_to_instance_map[val[0]]
                else:
                    inst = typ(*val, name=instance_name)
                    typ._value_to_instance_map[inst.value] = inst
                setattr(typ, instance_name, inst)

            # noinspection PyUnresolvedReferences
            typ.__call__ = typ.__new__ = typ.get
            del typ.__init__
            typ.__hash__ = mcs.__hash
            typ.__eq__ = mcs.__eq
            typ.__copy__ = mcs.__copy
            typ.__deepcopy__ = mcs.__deepcopy
            typ.__reduce__ = mcs.__reduce
            if "__str__" not in namespace:
                typ.__str__ = mcs.__str
            if "__repr__" not in namespace:
                typ.__repr__ = mcs.__repr

            if f"_{name}__init_late" in namespace:
                fun = namespace[f"_{name}__init_late"]
                for instance in typ._value_to_instance_map.values():
                    fun(instance)
                delattr(typ, f"_{name}__init_late")

            typ.__setattr__ = typ.__delattr__ = mcs.__restrict_modification
            typ._finalized = True
        return typ

    @staticmethod
    def __new(cls, *values, **_):
        __new__ = _resolve_new(cls.__bases__)
        if __new__:
            __new__, typ = __new__
            obj = __new__(cls, *values)
            obj._base_typed = typ
            return obj

        return object.__new__(cls)

    @staticmethod
    def __init(instance, value: Any, name: Text):
        base_val_type = getattr(instance, "_base_typed", None)
        if base_val_type:
            value = base_val_type(value)
        instance.value = value
        instance.name = name

    # pylint: disable=missing-docstring
    @staticmethod
    def get(typ, val=None):
        # noinspection PyProtectedMember
        if not isinstance(typ._value_to_instance_map, dict):
            for cls in typ.mro():
                if cls is typ:
                    continue
                if hasattr(cls, "_value_to_instance_map") and isinstance(
                    cls._value_to_instance_map, dict
                ):
                    return cls._value_to_instance_map[val]
            raise ValueError(
                f"Value {val} is not found in this enum type declaration"
            )
        # noinspection PyProtectedMember
        member = typ._value_to_instance_map.get(val)
        if member is None:
            raise ValueError(
                f"Value {val} is not found in this enum type declaration"
            )
        return member

    @staticmethod
    def __eq(val, other):
        return isinstance(val, type(other)) and (
            val is other if type(other) is type(val) else val.value == other
        )

    def __hash(cls):
        # noinspection PyUnresolvedReferences
        return hash(cls.value)

    @staticmethod
    def __restrict_modification(*a, **k):
        raise TypeError(
            f"Enum-like classes strictly prohibit changing any attribute/property"
            f" after they are once set"
        )

    def __iter__(cls):
        return iter(cls._value_to_instance_map.values())

    def __setattr__(cls, key, value):
        if hasattr(cls, "_finalized"):
            cls.__restrict_modification()
        super().__setattr__(key, value)

    def __delattr__(cls, item):
        if hasattr(cls, "_finalized"):
            cls.__restrict_modification()
        super().__delattr__(item)

    def __getitem__(cls, item):
        return getattr(cls, item)

    def has_value(cls, value):
        return value in cls._value_to_instance_map

    def to_choices(cls):
        return [(key, key) for key in cls._value_to_instance_map.keys()]

    def values(cls):
        return cls._value_to_instance_map.keys()

    def key_description_list(cls):
        result = []
        for key in cls._value_to_instance_map.keys():
            enum_key = "_".join(
                re.sub(
                    "([A-Z][a-z]+)", r" \1", re.sub("([A-Z]+)", r" \1", key)
                ).split()
            ).upper()
            result.append((key, cls[enum_key].description))
        return result

    # pylint: disable=unused-argument
    # noinspection PyUnusedLocal,SpellCheckingInspection
    def __deepcopy(cls, memodict=None):
        return cls

    def __copy(cls):
        return cls

    def __reduce(cls):
        typ = type(cls)
        # noinspection PyUnresolvedReferences
        return typ.get, (typ, cls.value)

    @staticmethod
    def __str(clz):
        return f"{clz.__class__.__name__}.{clz.name}"

    @staticmethod
    def __repr(clz):
        return f"<{clz.__class__.__name__}.{clz.name}: {repr(clz.value)}>"

    def __dir__(self) -> Iterable[str]:
        return [
            k
            for k in super().__dir__()
            if k not in ("_finalized", "_value_to_instance_map")
        ]

    # def __choices__(self) -> Iterable[str]:
    # return [()]

    @staticmethod
    def __dir(bases, namespace, *_, **__):
        keys = [
            k
            for k in namespace.keys()
            if k in ("__annotations__", "__module__", "__qualname__")
            or not k.startswith("_")
        ]
        for bcls in bases:
            keys.extend(dir(bcls))
        return list(set(keys))


class KeyDescriptionEnum(metaclass=FastEnum):
    description: Text
    __slots__ = ("description",)

    def __init__(self, value, description, name):
        # noinspection PyDunderSlots,PyUnresolvedReferences
        self.value = value
        # noinspection PyDunderSlots,PyUnresolvedReferences
        self.name = name
        self.description = description

    def describe(self):
        return self.description
