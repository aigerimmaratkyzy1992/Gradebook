from typing import ClassVar

from pydantic import BaseModel, model_validator


class PatchModel(BaseModel):
    """PATCH денесі: бос емес бағандарға айқын null жіберуге болмайды (422).

    Әйтпесе null сервиске жетіп, NOT NULL бағанында 500 қатесін тудырады."""

    non_nullable: ClassVar[tuple[str, ...]] = ()

    @model_validator(mode="after")
    def _reject_null(self) -> "PatchModel":
        for name in self.non_nullable:
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"Поле {name} не может быть null")
        return self
