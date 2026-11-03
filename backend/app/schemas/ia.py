from pydantic import BaseModel, Field


class PreguntaIA(BaseModel):
    pregunta: str = Field(
        min_length=1,
        max_length=2000
    )

    id_conversacion: int | None = Field(
        default=None,
        gt=0
    )