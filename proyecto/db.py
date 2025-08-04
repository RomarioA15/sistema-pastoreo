from flask_mysqldb import MySQL

# Initialize MySQL
mysql = MySQL()
 
def init_app(app):
    """Initialize the MySQL extension with the app"""
    mysql.init_app(app) 