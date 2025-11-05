#!/usr/bin/env python3
"""
Script to seed the database with UIUC-themed caches in the Champaign area.
"""

import random
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

# UIUC campus landmarks and locations (latitude, longitude)
UIUC_CACHES = [
    # Main Quad Area
    {"title": "Alma Mater Statue", "description": "Find the iconic Alma Mater statue at the heart of campus. The statue represents knowledge and learning.", "lat": 40.1081, "lon": -88.2272, "difficulty": 1, "category": "landmark"},
    {"title": "Foellinger Auditorium", "description": "Historic auditorium on the Main Quad. A great place for concerts and events.", "lat": 40.1075, "lon": -88.2275, "difficulty": 2, "category": "building"},
    {"title": "Altgeld Hall", "description": "The iconic bell tower building. Home to mathematics and some of the oldest architecture on campus.", "lat": 40.1085, "lon": -88.2280, "difficulty": 2, "category": "building"},
    {"title": "Illini Union", "description": "The student union building. Find the hidden cache near the main entrance.", "lat": 40.1078, "lon": -88.2265, "difficulty": 1, "category": "building"},
    {"title": "Lincoln Hall", "description": "Historic building named after Abraham Lincoln. Check the north side for the cache.", "lat": 40.1088, "lon": -88.2278, "difficulty": 2, "category": "building"},
    
    # Engineering Campus
    {"title": "Engineering Quad", "description": "The Engineering Quad is home to many engineering buildings. Look near the center fountain.", "lat": 40.1120, "lon": -88.2280, "difficulty": 2, "category": "campus"},
    {"title": "Grainger Library", "description": "The massive engineering library. Find the cache near the main entrance.", "lat": 40.1125, "lon": -88.2285, "difficulty": 1, "category": "building"},
    {"title": "Bardeen Quad", "description": "Named after Nobel laureate John Bardeen. A peaceful spot on the engineering campus.", "lat": 40.1115, "lon": -88.2290, "difficulty": 2, "category": "campus"},
    {"title": "ECE Building", "description": "Electrical and Computer Engineering building. Check the south side.", "lat": 40.1130, "lon": -88.2295, "difficulty": 3, "category": "building"},
    {"title": "Digital Computer Lab", "description": "Historic building where early computers were developed. Look near the entrance.", "lat": 40.1118, "lon": -88.2288, "difficulty": 2, "category": "building"},
    
    # South Quad / Memorial Stadium Area
    {"title": "Memorial Stadium", "description": "The Fighting Illini football stadium. Find the cache near the main entrance.", "lat": 40.1020, "lon": -88.2350, "difficulty": 1, "category": "sports"},
    {"title": "State Farm Center", "description": "Home of Illini basketball. Check the north side of the building.", "lat": 40.1030, "lon": -88.2340, "difficulty": 2, "category": "sports"},
    {"title": "ARC Recreation Center", "description": "The Activities and Recreation Center. Find the cache near the main entrance.", "lat": 40.1040, "lon": -88.2360, "difficulty": 1, "category": "sports"},
    {"title": "Ice Arena", "description": "The university ice arena. Look for the cache near the parking lot.", "lat": 40.1015, "lon": -88.2370, "difficulty": 2, "category": "sports"},
    
    # North Campus / Research Park
    {"title": "Research Park", "description": "UIUC Research Park is home to many tech companies. Find the cache near the main office.", "lat": 40.1180, "lon": -88.2250, "difficulty": 3, "category": "campus"},
    {"title": "Siebel Center", "description": "The computer science building. Check the west side entrance.", "lat": 40.1135, "lon": -88.2265, "difficulty": 2, "category": "building"},
    {"title": "NCSA Building", "description": "National Center for Supercomputing Applications. Look near the main entrance.", "lat": 40.1140, "lon": -88.2270, "difficulty": 3, "category": "building"},
    
    # Green Street / Campustown
    {"title": "Green Street Bridge", "description": "The bridge over Wright Street. A popular student spot.", "lat": 40.1095, "lon": -88.2240, "difficulty": 1, "category": "landmark"},
    {"title": "Campustown Plaza", "description": "The heart of Campustown. Find the cache near the central plaza.", "lat": 40.1100, "lon": -88.2235, "difficulty": 2, "category": "campus"},
    {"title": "Krannert Center", "description": "Krannert Center for the Performing Arts. Check the main entrance.", "lat": 40.1105, "lon": -88.2250, "difficulty": 2, "category": "building"},
    
    # Library Quad
    {"title": "Main Library", "description": "The main campus library. Look for the cache near the south entrance.", "lat": 40.1090, "lon": -88.2285, "difficulty": 1, "category": "building"},
    {"title": "Undergraduate Library", "description": "The UGL (Undergraduate Library). Check the east side.", "lat": 40.1100, "lon": -88.2290, "difficulty": 1, "category": "building"},
    
    # Natural Areas
    {"title": "Japan House", "description": "The beautiful Japan House and gardens. A peaceful spot on campus.", "lat": 40.1050, "lon": -88.2200, "difficulty": 2, "category": "landmark"},
    {"title": "Meadowbrook Park", "description": "A beautiful park near campus. Find the cache near the entrance.", "lat": 40.0950, "lon": -88.2400, "difficulty": 2, "category": "nature"},
    {"title": "Boneyard Creek", "description": "The Boneyard Creek runs through campus. Find the cache near the bridge.", "lat": 40.1120, "lon": -88.2300, "difficulty": 3, "category": "nature"},
    {"title": "South Quad Trees", "description": "Beautiful trees on South Quad. Look for the cache near the center.", "lat": 40.1050, "lon": -88.2320, "difficulty": 2, "category": "nature"},
    
    # Residence Halls
    {"title": "Six Pack Residence Halls", "description": "The six-pack residence halls. Find the cache near the main quad.", "lat": 40.1060, "lon": -88.2330, "difficulty": 1, "category": "building"},
    {"title": "Ikenberry Commons", "description": "The Ikenberry residence halls. Check the main entrance area.", "lat": 40.1040, "lon": -88.2340, "difficulty": 2, "category": "building"},
    
    # More Campus Buildings
    {"title": "Gregory Hall", "description": "Home to journalism and communications. Look near the main entrance.", "lat": 40.1070, "lon": -88.2260, "difficulty": 2, "category": "building"},
    {"title": "Davenport Hall", "description": "Historic building on the Quad. Check the east side.", "lat": 40.1082, "lon": -88.2270, "difficulty": 2, "category": "building"},
    {"title": "English Building", "description": "The English building. Find the cache near the south entrance.", "lat": 40.1080, "lon": -88.2268, "difficulty": 2, "category": "building"},
    {"title": "Foreign Languages Building", "description": "The FLB building. Look near the main entrance.", "lat": 40.1075, "lon": -88.2272, "difficulty": 2, "category": "building"},
    
    # Research Areas
    {"title": "Beckman Institute", "description": "The Beckman Institute for Advanced Science and Technology.", "lat": 40.1145, "lon": -88.2260, "difficulty": 3, "category": "building"},
    {"title": "Materials Science Building", "description": "Materials Science and Engineering building. Check the west side.", "lat": 40.1128, "lon": -88.2288, "difficulty": 2, "category": "building"},
    {"title": "Mechanical Engineering Lab", "description": "The ME building. Find the cache near the entrance.", "lat": 40.1122, "lon": -88.2292, "difficulty": 2, "category": "building"},
    
    # Arts & Culture
    {"title": "Krannert Art Museum", "description": "The art museum on campus. Look near the main entrance.", "lat": 40.1108, "lon": -88.2255, "difficulty": 1, "category": "building"},
    {"title": "Spurlock Museum", "description": "World cultures museum. Check the east side entrance.", "lat": 40.1072, "lon": -88.2258, "difficulty": 2, "category": "building"},
    
    # More Campus Locations
    {"title": "Bousfield Hall", "description": "Psychology building. Find the cache near the main entrance.", "lat": 40.1065, "lon": -88.2285, "difficulty": 2, "category": "building"},
    {"title": "Loomis Lab", "description": "Physics building. Check the south side.", "lat": 40.1078, "lon": -88.2288, "difficulty": 2, "category": "building"},
    {"title": "Psychology Building", "description": "The psychology building. Look near the entrance.", "lat": 40.1068, "lon": -88.2282, "difficulty": 2, "category": "building"},
    {"title": "Chemistry Annex", "description": "Chemistry building annex. Find the cache near the west side.", "lat": 40.1085, "lon": -88.2295, "difficulty": 3, "category": "building"},
    
    # Additional Champaign Locations
    {"title": "West Side Park", "description": "Beautiful park in downtown Champaign. Find the cache near the fountain.", "lat": 40.1165, "lon": -88.2435, "difficulty": 2, "category": "nature"},
    {"title": "Champaign Public Library", "description": "The main public library. Check the east side entrance.", "lat": 40.1170, "lon": -88.2440, "difficulty": 1, "category": "building"},
    {"title": "Virginia Theatre", "description": "Historic theatre in downtown Champaign. Look near the main entrance.", "lat": 40.1160, "lon": -88.2430, "difficulty": 2, "category": "landmark"},
    {"title": "Market Street", "description": "Downtown Champaign market area. Find the cache near the center.", "lat": 40.1155, "lon": -88.2425, "difficulty": 2, "category": "campus"},
    
    # More UIUC Campus Spots
    {"title": "Morrow Plots", "description": "The oldest agricultural research plots in America. Find the cache near the sign.", "lat": 40.1080, "lon": -88.2290, "difficulty": 3, "category": "landmark"},
    {"title": "South Farms", "description": "Agricultural research area. Check near the main entrance.", "lat": 40.0900, "lon": -88.2300, "difficulty": 3, "category": "campus"},
    {"title": "Vet Med Building", "description": "Veterinary medicine building. Look near the entrance.", "lat": 40.1000, "lon": -88.2200, "difficulty": 2, "category": "building"},
    {"title": "Animal Sciences Building", "description": "Animal sciences building. Find the cache near the west side.", "lat": 40.0995, "lon": -88.2195, "difficulty": 2, "category": "building"},
    
    # Final Campus Locations
    {"title": "Busey Hall", "description": "Historic residence hall. Check the main entrance area.", "lat": 40.1065, "lon": -88.2295, "difficulty": 2, "category": "building"},
    {"title": "Freer Hall", "description": "Kinesiology and community health building. Look near the entrance.", "lat": 40.1045, "lon": -88.2355, "difficulty": 2, "category": "building"},
    {"title": "Huff Hall", "description": "Kinesiology and recreation building. Find the cache near the main entrance.", "lat": 40.1040, "lon": -88.2360, "difficulty": 1, "category": "building"},
    {"title": "Armory Building", "description": "The historic armory building. Check the south side.", "lat": 40.1075, "lon": -88.2290, "difficulty": 2, "category": "building"},
    {"title": "Natural History Building", "description": "The natural history building. Look near the main entrance.", "lat": 40.1072, "lon": -88.2285, "difficulty": 2, "category": "building"},
]

def seed_caches():
    """Add UIUC-themed caches to the database."""
    db: Session = SessionLocal()
    try:
        # Get the admin user (creator)
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            print("Error: Admin user not found. Please ensure the admin user exists.")
            return
        
        # Add some random variation to coordinates to make them more interesting
        added_count = 0
        for cache_data in UIUC_CACHES:
            # Check if cache already exists (by title)
            existing = db.query(models.Cache).filter(models.Cache.title == cache_data["title"]).first()
            if existing:
                print(f"Cache '{cache_data['title']}' already exists, skipping...")
                continue
            
            # Add small random variation to coordinates (within ~50 meters)
            lat_offset = random.uniform(-0.0005, 0.0005)  # ~50 meters
            lon_offset = random.uniform(-0.0005, 0.0005)
            
            cache = models.Cache(
                title=cache_data["title"],
                description=cache_data["description"],
                latitude=cache_data["lat"] + lat_offset,
                longitude=cache_data["lon"] + lon_offset,
                difficulty=cache_data["difficulty"],
                category=cache_data["category"],
                creator_id=admin_user.id
            )
            db.add(cache)
            added_count += 1
        
        db.commit()
        print(f"✅ Successfully added {added_count} UIUC-themed caches!")
        print(f"Total caches in database: {db.query(models.Cache).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding caches: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_caches()

