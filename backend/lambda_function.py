import base64
import http.client
import json
import os
import subprocess

def convert_to_wav(song_data):
    decoded_3gp_file = '/tmp/temp_audio.3gp'
    wav_file = '/tmp/temp_audio.wav'

    with open(decoded_3gp_file, 'wb') as f:
        f.write(song_data)

    ffmpeg_command = [
        '/opt/bin/ffmpeg', '-y', '-i', decoded_3gp_file, '-ar', '44100', '-ac', '1',
        '-acodec', 'pcm_s16le', wav_file,
    ]
    subprocess.run(ffmpeg_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    with open(wav_file, 'rb') as f:
        wav_data = f.read()
    return wav_data

def get_song_info(wav_data):
    api_key = os.getenv('API_KEY')
    if not api_key:
        raise ValueError('API_KEY environment variable is not set')

    conn = http.client.HTTPSConnection('shazam.p.rapidapi.com')
    headers = {
        'x-rapidapi-key': api_key,
        'x-rapidapi-host': 'shazam.p.rapidapi.com',
        'Content-Type': 'text/plain',
    }
    conn.request('POST', '/songs/v2/detect', wav_data, headers)
    res = conn.getresponse()
    data = res.read()
    return json.loads(data.decode('utf-8'))

def lambda_handler(event, _context):
    method = event['requestContext']['http']['method']
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': None,
        }
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps({'error': 'Method Not Allowed'}),
        }
    body = json.loads(event['body'])
    song_b64 = body['song']
    song_data = base64.b64decode(song_b64)
    wav_data = convert_to_wav(song_data)
    wav_b64 = base64.b64encode(wav_data).decode()
    song_info = get_song_info(wav_b64)

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps(song_info),
    }
