from flask import Flask
from flask_restful import Resource, Api
from flask_cors import CORS #comment this on deployment

import csv

app = Flask(__name__)
CORS(app) #comment this on deployment
api = Api(app)

filename = '/home/jpowe/projects/games/out.csv'

def make_game_state(game_state):
    fmt = int(game_state)

    def col_of_hash(num):
        length = num & 7
        num = num >> 3
        col = ['.' for _ in range(6)]
        for i in range(length):
            col[i] = ('A' if num % 2 == 1 else 'B')
            num = num >> 1
        return col

    board = []
    for i in range(7):
        board.append(col_of_hash(fmt % (1 << 9)))
        fmt = fmt >> 9

    return board

# def make_game_state(game_state):
#     game_state = int(game_state)
#     board = []

#     num_pieces = 0
#     for i in range(9):
#         value = game_state % 3
#         game_state = game_state // 3

#         if value == 0:
#             board.append(' ')
#         elif value == 1:
#             board.append('X')
#             num_pieces += 1
#         elif value == 2:
#             board.append('O')
#             num_pieces += 1

#     return board

# def make_game_state(game_state):
#     return f'{game_state}'

def process_node(row):
    if row['children'] == '' or row['children'] == '[]':
        children = []
    else:
        children = row['children'].split('|')

    if row["history"] == '':
        row_id = row["id"]
    else:
        row_id = f'{row["history"]}|{row["id"]}'

    if '/' in row['score'] and row['score'].split('/')[0] == row['score'].split('/')[1]:
        score = row['score'].split('/')[0]
    else:
        score = row['score']

    return row_id, {
        'gameState': make_game_state(row['game_state']),
        'score' : score,
        'children' : children,
        # 'children' : row['children'].split('|'),
        'init_alpha' : row['init_alpha'],
        'init_beta' : row['init_beta'],
        'init_lb' : row['init_lb'],
        'init_ub' : row['init_ub'],
    }

class HelloWorld(Resource):
    def get(self):
        ret = {}
        with open(filename, newline='') as csvfile:
            reader = csv.DictReader(csvfile, fieldnames=['id', 'history', 'game_state', 'score', 'init_alpha', 'init_beta', 'children','is_cutoff', 'init_lb', 'init_ub'])
            for row in reader:
                state_id, node = process_node(row)
                ret[str(state_id)] = node
            ret['root'] = state_id
        return ret

api.add_resource(HelloWorld, '/test')

if __name__ == '__main__':
    app.run(debug=True)
