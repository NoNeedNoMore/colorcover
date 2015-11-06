Drop Schema If Exists colorcover Cascade;

Create Schema colorcover;

Create Table colorcover.sessions(
	id text Primary Key,
	dateCreate timestamp Default now(),
	session json
);

Create Table colorcover.users(
	id serial Primary Key,
	dateCreate timestamp Default now(),
	dateUpdate timestamp Default now(),
	username text Not Null,
	email text Not Null,
	hash text Not Null,
	salt text Not Null
);
Create Unique Index username On colorcover.users (Lower(username));
Create Unique Index email On colorcover.users (Lower(email));

Create Table colorcover.perks(
	id serial Primary Key,
	name text Not Null
);
Create Unique Index perksname On colorcover.perks (Lower(name));

Create Table colorcover.roles(
	id serial Primary Key,
	name text Not Null
);
Create Unique Index rolesname On colorcover.roles (Lower(name));

Create Table colorcover.rolesToUsers(
	id serial Primary Key,
	role integer References colorcover.roles On Delete Cascade,
	"user" integer References colorcover.users On Delete Cascade
);

Create Table colorcover.perksToUsers(
	id serial Primary Key,
	perk integer References colorcover.perks On Delete Cascade,
	"user" integer References colorcover.users On Delete Cascade
);

Create Table colorcover.bannedPerksToUsers(
	id serial Primary Key,
	perk integer References colorcover.perks On Delete Cascade,
	"user" integer References colorcover.users On Delete Cascade
);

Create Table colorcover.perksToRoles(
	id serial Primary Key,
	perk integer References colorcover.perks On Delete Cascade,
	role integer References colorcover.roles On Delete Cascade
);

Create Table colorcover.games(
	id serial Primary Key,
	dateCreate timestamp Default now(),
	isNew boolean Default true,
	isActive boolean Default false,
	game json Not Null,
	author integer References colorcover.users
);

Create Table colorcover.usersToGames(
	id serial Primary Key,
	sequence integer Not Null,
	"user" integer References colorcover.users On Delete Cascade,
	game integer References colorcover.games On Delete Cascade
);

Create Table colorcover.tags(
	id serial Primary Key,
	name text Not Null
);
Create Unique Index tagsname On colorcover.tags (Lower(name));

Create Table colorcover.sections(
	id serial Primary Key,
	name text Not Null
);
Create Unique Index sectionsname On colorcover.sections (Lower(name));

Create Table colorcover.topics(
	id serial Primary Key,
	dateCreate timestamp Default now(),
	author integer References colorcover.users,
	section integer References colorcover.sections,
	name text Not Null
);
Create Unique Index topicsname On colorcover.topics (Lower(name));

Create Table colorcover.tagsToTopics(
	id serial Primary Key,
	tag integer References colorcover.tags On Delete Cascade,
	topic integer References colorcover.topics On Delete Cascade	
);

Create Table colorcover.posts(
	id serial Primary Key,
	dateCreate timestamp Default now(),
	dateUpdate timestamp Default now(),
	topic integer References colorcover.topics On Delete Cascade,
	author integer References colorcover.users On Delete Cascade,
	message text Not Null
);

Insert Into colorcover.roles (name) Values ('admin'), ('moder'), ('user');