FROM python:3.6

COPY requirements.txt /
RUN pip install -r /requirements.txt

COPY src /app

WORKDIR /app

CMD python main.py
