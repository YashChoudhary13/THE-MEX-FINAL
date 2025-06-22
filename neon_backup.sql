--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: daily_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_reports (
    id integer NOT NULL,
    date date NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    total_revenue numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_reports OWNER TO postgres;

--
-- Name: daily_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.daily_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_reports_id_seq OWNER TO postgres;

--
-- Name: daily_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.daily_reports_id_seq OWNED BY public.daily_reports.id;


--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.menu_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    description text
);


ALTER TABLE public.menu_categories OWNER TO postgres;

--
-- Name: menu_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_categories_id_seq OWNER TO postgres;

--
-- Name: menu_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_categories_id_seq OWNED BY public.menu_categories.id;


--
-- Name: menu_item_option_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.menu_item_option_groups (
    id integer NOT NULL,
    menu_item_id integer NOT NULL,
    name text NOT NULL,
    required boolean DEFAULT false NOT NULL,
    max_selections integer DEFAULT 1 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.menu_item_option_groups OWNER TO postgres;

--
-- Name: menu_item_option_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_item_option_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_item_option_groups_id_seq OWNER TO postgres;

--
-- Name: menu_item_option_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_item_option_groups_id_seq OWNED BY public.menu_item_option_groups.id;


--
-- Name: menu_item_options; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.menu_item_options (
    id integer NOT NULL,
    option_group_id integer NOT NULL,
    name text NOT NULL,
    price_modifier double precision DEFAULT 0 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    available boolean DEFAULT true NOT NULL
);


ALTER TABLE public.menu_item_options OWNER TO postgres;

--
-- Name: menu_item_options_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_item_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_item_options_id_seq OWNER TO postgres;

--
-- Name: menu_item_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_item_options_id_seq OWNED BY public.menu_item_options.id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    category_id integer NOT NULL,
    image text,
    featured boolean DEFAULT false,
    label text,
    rating double precision DEFAULT 5.0,
    review_count integer DEFAULT 0,
    ingredients text,
    calories text,
    allergens text,
    dietary_info text[],
    prep_time integer DEFAULT 15,
    sold_out boolean DEFAULT false,
    is_hot boolean DEFAULT false,
    is_best_seller boolean DEFAULT false,
    has_options boolean DEFAULT false NOT NULL
);


ALTER TABLE public.menu_items OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO postgres;

--
-- Name: menu_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;


--
-- Name: monthly_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.monthly_reports (
    id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    total_revenue numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.monthly_reports OWNER TO postgres;

--
-- Name: monthly_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.monthly_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthly_reports_id_seq OWNER TO postgres;

--
-- Name: monthly_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.monthly_reports_id_seq OWNED BY public.monthly_reports.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text NOT NULL,
    preparation_instructions text,
    subtotal double precision NOT NULL,
    service_fee double precision NOT NULL,
    tax double precision NOT NULL,
    total double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    items jsonb NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now(),
    daily_order_number integer,
    payment_reference text,
    completed_at timestamp without time zone,
    promo_code text,
    delivery_address text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.promo_codes (
    id integer NOT NULL,
    code text NOT NULL,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value double precision NOT NULL,
    min_order_value double precision DEFAULT 0,
    max_discount_amount double precision,
    active boolean DEFAULT true NOT NULL,
    usage_limit integer,
    current_usage integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.promo_codes OWNER TO postgres;

--
-- Name: promo_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.promo_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_codes_id_seq OWNER TO postgres;

--
-- Name: promo_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.promo_codes_id_seq OWNED BY public.promo_codes.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: special_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.special_offers (
    id integer NOT NULL,
    menu_item_id integer NOT NULL,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value double precision NOT NULL,
    original_price double precision NOT NULL,
    special_price double precision NOT NULL,
    active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone
);


ALTER TABLE public.special_offers OWNER TO postgres;

--
-- Name: special_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.special_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.special_offers_id_seq OWNER TO postgres;

--
-- Name: special_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.special_offers_id_seq OWNED BY public.special_offers.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: daily_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_reports ALTER COLUMN id SET DEFAULT nextval('public.daily_reports_id_seq'::regclass);


--
-- Name: menu_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN id SET DEFAULT nextval('public.menu_categories_id_seq'::regclass);


--
-- Name: menu_item_option_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_option_groups ALTER COLUMN id SET DEFAULT nextval('public.menu_item_option_groups_id_seq'::regclass);


--
-- Name: menu_item_options id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_options ALTER COLUMN id SET DEFAULT nextval('public.menu_item_options_id_seq'::regclass);


--
-- Name: menu_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);


--
-- Name: monthly_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.monthly_reports ALTER COLUMN id SET DEFAULT nextval('public.monthly_reports_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: promo_codes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes ALTER COLUMN id SET DEFAULT nextval('public.promo_codes_id_seq'::regclass);


--
-- Name: special_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.special_offers ALTER COLUMN id SET DEFAULT nextval('public.special_offers_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: daily_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_reports (id, date, total_orders, total_revenue, created_at, updated_at) FROM stdin;
3	2025-06-22	0	0.00	2025-06-21 23:00:01.915324	2025-06-21 23:00:01.915324
1	2025-06-18	0	0.00	2025-06-17 23:00:01.099889	2025-06-17 23:59:59.9
2	2025-06-19	0	0.00	2025-06-18 23:02:22.508074	2025-06-18 23:14:55.333
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_categories (id, name, slug, "order", description) FROM stdin;
7	Signature Burgers	signature-burgers	1	Bold, flavour-packed double smash burgers.
8	Gourmet Fries & Loaded Delights	gourmet-fries--loaded-delights	2	Crispy fries with irresistible toppings and bold flavours.
9	Nachos & Chips	nachos--chips	3	Crunchy tortilla options with creamy queso and fresh toppings.
10	Burritos & Bowls	burritos--bowls	4	Handcrafted with fresh ingredients and your favourite fillings.
11	Authentic Tacos	authentic-tacos	5	Flour or corn shells packed with bold fillings and fresh toppings.
12	Quesadillas	quesadillas	6	Melty, crispy, and made to satisfy.
14	Sides & Extras	sides--extras	7	Perfect add-ons to complete your meal.
15	 Desserts	-desserts	8	Amy’s homemade sweet treats.\n\n
16	Signature Sauces	signature-sauces	9	Add extra flavour with our house-made sauces.
17	Drinks	drinks	10	Chilled, Refreshing and energizing.
\.


--
-- Data for Name: menu_item_option_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_item_option_groups (id, menu_item_id, name, required, max_selections, "order") FROM stdin;
1	5	Meat	f	1	0
\.


--
-- Data for Name: menu_item_options; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_item_options (id, option_group_id, name, price_modifier, "order", available) FROM stdin;
1	1	Option A	5	0	t
2	1	Option B	3	0	t
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.menu_items (id, name, description, price, category_id, image, featured, label, rating, review_count, ingredients, calories, allergens, dietary_info, prep_time, sold_out, is_hot, is_best_seller, has_options) FROM stdin;
44	 Guacamole 	Freshly mashed avocados with lime, cilantro, and seasoning — smooth, zesty, and addictive.	3.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
45	Pico de Gallo	A fresh mix of chopped tomatoes, onions, coriander, and lime — crunchy, tangy, and refreshing.	3.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
46	Salsa 	House-made with roasted tomatoes and chili — bold, smoky, and full of flavor.	2.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
47	Corn	Charred sweet corn with a hint of spice and lime — simple, sweet, and satisfying.	2.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
48	Beans	Slow-cooked, seasoned beans — hearty, earthy, and the perfect taco companion.	2.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
26	Birria Brisket Burger	Double brisket smash patties seasoned with beef rub and consomme, stacked with cheese, jalapeños, fresh greens, and house-made sauces in a brioche bun toasted with consomme.	10	7	\N	f	\N	5	0	\N	\N	\N	\N	15	t	f	f	f
27	Plain Fries	Crispy, golden-cut potato fries seasoned with a pinch of salt. Perfectly fried for a light, crunchy bite—served hot and fresh every time.	4	8	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
49	Banoffee Pie	A luscious layered dessert of crushed biscuits, rich toffee, sliced bananas, and whipped cream — sweet, silky, and utterly indulgent.	10	15	\N	f	\N	5	0	\N	\N	\N	\N	15	t	f	f	f
50	Ice Cream Dessert Burrito 	Rolled crepe with your choice of ice cream, sauce, and toppings.	10	15	\N	f	\N	5	0	\N	\N	\N	\N	15	t	f	f	f
51	Mole Sauce	A rich, smoky-sweet Mexican classic made with chilies, spices, and a hint of chocolate.	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
28	Spicy Seasoned Fries	Tossed in our signature spice rub blend.	5	8	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
29	Garlic & Parmesan Fries	Coated in garlic butter and parmesan cheese.	6	8	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
31	Loaded Fries	Fully loaded with your choice of meat and toppings.	12	8	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
32	Nachos	Tortilla chips with queso, beans, salsa, sour cream, jalapeños, and sauce of your choice.	9	9	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
33	Mini Nachos	A snack-sized serving of crispy tortilla chips layered with melted cheese, tangy salsa, and a sprinkle of jalapeños. Big flavor in a small bite — perfect for sharing or solo cravings.	6	9	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
34	Tortilla Chips with Queso	Freshly fried tortilla chips served with a warm, creamy queso dip. A perfect blend of smooth cheese and subtle spices — the ultimate comfort snack with a cheesy twist.	5	9	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
30	Fries with Queso	Topped with rich, house-made queso sauce.	6	8		f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
35	Classic Burrito	Choose from slow-cooked beef, pulled pork, chicken, or veg, with a range of fillings.	10.5	10	\N	f	\N	5	0	\N	\N	\N	\N	15	f	t	f	f
36	Birria Burrito	Wrap dipped in savoury consomme, filled and grilled on the flat top.	11	10	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
37	Burrito Bowl	All the burrito flavours in a bowl—includes meat or veg, lettuce, black beans, pico de gallo, corn, rice, and sauce.	12	10	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
38	3 x Soft Shell Tacos	Filled with slow-cooked beef, pulled pork, chicken or veg, plus lettuce, sour cream, salsa, and jalapeños.	13.5	11	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
39	3 x Birria Tacos	Shells dipped in consomme and grilled on the flat top, served with a pot of consomme for dipping.	14.5	11	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
40	Meat Quesadillas 	Choose from beef, pork, chicken or veg with refried beans and sauce.	9	12	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
41	Cheese Quesadillas	Golden, pan-toasted tortillas stuffed with a generous blend of melted cheeses — crispy on the outside, irresistibly gooey inside.	7	12	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
42	Queso (GF)	Creamy, rich cheese dip with a touch of spice — perfect with chips or on its own. (Gluten-Free)	3	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
43	Consommé	A warm, flavorful beef broth infused with herbs and spices — great for dipping or sipping.\n\n	2.5	14	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
52	Lemon Garlic Crema 	A zesty, creamy blend of lemon and garlic — perfect for brightening up any bite.\n\n	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
53	Avocado Crema	Smooth and cool with the goodness of ripe avocados and a touch of lime.\n\n	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
54	Sour Cream	Cool, tangy, and timeless — a creamy classic that pairs with everything.	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
55	BBQ Sauce	Smoky, sweet, and bold — our house BBQ adds punch to every bite.	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
56	Jalapeño Hot Sauce	Fiery and fresh — made with real jalapeños for that perfect spicy kick.	2.5	16	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
57	Strawberry Peach	A sweet and juicy fusion of ripe strawberries and sun-kissed peaches, served chilled.	3.5	17	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
58	Peach Raspberry Refresher	Zesty raspberries meet mellow peach in this fruity, sparkling cooler.	3.5	17	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
59	Frozen Mango Monster Punch	A bold, icy blend of mango and citrus with an energizing kick of Monster. Sweet, slushy, and unstoppable.	4.5	17	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
60	Coke · Diet Coke · 7up · Fanta Orange	Classic fizzy favorites served ice-cold.	2	17	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
61	San Pellegrino Orange	Lightly sparkling with a crisp, natural orange zing.\n\n	1.98	17	\N	f	\N	5	0	\N	\N	\N	\N	15	f	f	f	f
5	The Mex Burger	Double smash burger with smoked cheese, crispy corn taco, refried beans, pico de gallo, poblano peppers and a little bit of queso!	14.99	7	https://scontent.fjai8-1.fna.fbcdn.net/v/t39.30808-6/470203602_18016000436644923_8240666612134347088_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=NQCtLgdrBh8Q7kNvwEbShKP&_nc_oc=AdmB5vMltpDpM7mZbvRIWOwd2eCi7R2SGQNdSzfsuUYnZ8yZHqLuhfFyku9Vakwzu0M&_nc_zt=23&_nc_ht=scontent.fjai8-1.fna&_nc_gid=0B6_nnevdJ6v5UPHyoBQrQ&oh=00_AfNeoHzlP2PlPyw1h6ERWK0zKHSOddpBQFCrmknj4okrLQ&oe=685D2FD9	f	Best Seller	4.8	209	\N	\N	\N	\N	15	f	f	f	t
\.


--
-- Data for Name: monthly_reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.monthly_reports (id, year, month, total_orders, total_revenue, created_at, updated_at) FROM stdin;
1	2025	6	0	0.00	2025-06-17 23:00:01.189983	2025-06-21 23:00:02.523
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, customer_name, customer_email, customer_phone, preparation_instructions, subtotal, service_fee, tax, total, status, items, user_id, created_at, daily_order_number, payment_reference, completed_at, promo_code, delivery_address) FROM stdin;
13	Yash Choudhary		08824454998		12.99	2.99	1.0392000000000001	17.0192	cancelled	[{"id": 1748919076716, "name": "Signature Cocktail", "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b", "price": 12.99, "prepTime": 15, "quantity": 1, "menuItemId": 11}]	1	2025-06-03 02:52:03.046013	\N	\N	\N	\N	\N
17	John Smith	john.smith@example.com	+353-144-3730	Leave at door	45.98	2.99	3.68	52.65	completed	[{"id": 9, "price": 22.99, "quantity": 2}]	\N	2025-05-04 13:52:27.045	\N	\N	\N	\N	\N
19	Michael Brown	michael.brown@example.com	+353-446-9059	\N	29.98	2.99	2.4	35.37	completed	[{"id": 5, "price": 14.99, "quantity": 2}]	\N	2025-05-13 18:27:26.241	\N	\N	\N	\N	\N
11	Yash Choudhary		08824454998		32.97	2.99	2.6376	38.5976	cancelled	[{"id": 1747044161890, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 3, "menuItemId": 3}]	1	2025-05-12 10:02:54.52483	\N	\N	\N	\N	\N
12	Yash Choudhary		08824454998		21.98	2.99	1.7584	26.7284	cancelled	[{"id": 1748918638089, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 2, "menuItemId": 3}]	\N	2025-06-03 02:44:28.230623	\N	\N	\N	\N	\N
14	Yash Choudhary		08824454998		10.99	2.99	0.8792	14.859200000000001	cancelled	[{"id": 1748919524613, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-03 03:08:51.937073	\N	\N	\N	\N	\N
21	David Lee	david.lee@example.com	+353-718-1887	Leave at door	14.99	2.99	1.2	19.18	completed	[{"id": 5, "price": 14.99, "quantity": 1}]	\N	2025-06-03 23:30:02.959	\N	\N	\N	\N	\N
22	Lisa Chen	lisa.chen@example.com	+353-820-2259	Leave at door	62.97	2.99	5.04	71	completed	[{"id": 9, "price": 22.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-05-30 18:04:58.635	\N	\N	\N	\N	\N
23	Robert Davis	robert.davis@example.com	+353-326-1887	\N	27.98	2.99	2.24	33.21	completed	[{"id": 8, "price": 13.99, "quantity": 2}]	\N	2025-05-16 10:56:06.429	\N	\N	\N	\N	\N
26	Jennifer Taylor	jennifer.taylor@example.com	+353-892-9165	\N	13.99	2.99	1.12	18.1	cancelled	[{"id": 8, "price": 13.99, "quantity": 1}]	\N	2025-05-04 04:35:56.987	\N	\N	\N	\N	\N
27	Christopher Moore	christopher.moore@example.com	+353-617-5359	\N	78.95	2.99	6.32	88.26	completed	[{"id": 5, "price": 14.99, "quantity": 1}, {"id": 5, "price": 14.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 2}]	\N	2025-04-24 04:48:00.647	\N	\N	\N	\N	\N
28	Amanda White	amanda.white@example.com	+353-318-2176	\N	63.96	2.99	5.12	72.07	completed	[{"id": 5, "price": 14.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 2}]	\N	2025-04-22 18:14:01.537	\N	\N	\N	\N	\N
29	Daniel Anderson	daniel.anderson@example.com	+353-941-9472	Leave at door	13.99	2.99	1.12	18.1	completed	[{"id": 8, "price": 13.99, "quantity": 1}]	\N	2025-06-02 02:16:23.215	\N	\N	\N	\N	\N
30	Jessica Thomas	jessica.thomas@example.com	+353-976-9700	\N	101.94	2.99	8.16	113.09	completed	[{"id": 5, "price": 14.99, "quantity": 2}, {"id": 9, "price": 22.99, "quantity": 2}, {"id": 6, "price": 12.99, "quantity": 2}]	\N	2025-04-29 18:53:40.009	\N	\N	\N	\N	\N
31	Matthew Jackson	matthew.jackson@example.com	+353-361-5189	\N	16.99	2.99	1.36	21.34	completed	[{"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-05-20 14:48:08.69	\N	\N	\N	\N	\N
32	Ashley Martin	ashley.martin@example.com	+353-291-3791	\N	29.98	2.99	2.4	35.37	completed	[{"id": 6, "price": 12.99, "quantity": 1}, {"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-05-24 18:01:53.074	\N	\N	\N	\N	\N
33	Andrew Clark	andrew.clark@example.com	+353-711-9457	Leave at door	50.97	2.99	4.08	58.04	delivered	[{"id": 7, "price": 16.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-04-23 10:09:02.885	\N	\N	\N	\N	\N
24	Maria Garcia	maria.garcia@example.com	+353-450-1425	\N	89.94	2.99	7.2	100.13	confirmed	[{"id": 5, "price": 14.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 2}, {"id": 6, "price": 12.99, "quantity": 2}]	\N	2025-04-19 09:19:12.677	\N	\N	\N	\N	\N
25	James Miller	james.miller@example.com	+353-356-3917	\N	69.95	2.99	5.6	78.54	confirmed	[{"id": 6, "price": 12.99, "quantity": 2}, {"id": 5, "price": 14.99, "quantity": 2}, {"id": 8, "price": 13.99, "quantity": 1}]	\N	2025-05-13 18:08:20.869	\N	\N	\N	\N	\N
20	Emma Wilson	emma.wilson@example.com	+353-981-8098	Leave at door	16.99	2.99	1.36	21.34	confirmed	[{"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-05-04 16:33:11.557	\N	\N	\N	\N	\N
18	Sarah Johnson	sarah.johnson@example.com	+353-608-8628	Leave at door	25.98	2.99	2.08	31.05	delivered	[{"id": 6, "price": 12.99, "quantity": 2}]	\N	2025-05-07 11:16:42.037	\N	\N	\N	\N	\N
16	Live Revenue Test	revenue@test.com	123-456-7890	\N	14.99	2.99	1.44	19.42	confirmed	[{"id": 5, "price": 14.99, "quantity": 1}]	\N	2025-06-17 20:54:22.436473	\N	\N	\N	\N	\N
15	Test Customer	test@example.com	123-456-7890	\N	29.98	2.99	2.64	35.61	confirmed	[{"id": 5, "price": 14.99, "quantity": 2}]	\N	2025-06-17 20:54:15.506084	\N	\N	\N	\N	\N
34	Michelle Rodriguez	michelle.rodriguez@example.com	+353-200-6606	\N	71.96	2.99	5.76	80.71	completed	[{"id": 9, "price": 22.99, "quantity": 2}, {"id": 6, "price": 12.99, "quantity": 2}]	\N	2025-06-04 11:52:43.329	\N	\N	\N	\N	\N
35	Joshua Lewis	joshua.lewis@example.com	+353-171-4684	\N	12.99	2.99	1.04	17.02	cancelled	[{"id": 6, "price": 12.99, "quantity": 1}]	\N	2025-05-22 23:20:27.822	\N	\N	\N	\N	\N
36	Stephanie Walker	stephanie.walker@example.com	+353-351-2451	\N	86.95	2.99	6.96	96.9	completed	[{"id": 5, "price": 14.99, "quantity": 2}, {"id": 7, "price": 16.99, "quantity": 2}, {"id": 9, "price": 22.99, "quantity": 1}]	\N	2025-04-20 15:17:51.081	\N	\N	\N	\N	\N
37	Ryan Hall	ryan.hall@example.com	+353-230-5391	\N	85.96	2.99	6.88	95.83	completed	[{"id": 9, "price": 22.99, "quantity": 1}, {"id": 7, "price": 16.99, "quantity": 1}, {"id": 9, "price": 22.99, "quantity": 2}]	\N	2025-05-06 07:26:10.448	\N	\N	\N	\N	\N
38	Nicole Allen	nicole.allen@example.com	+353-761-2015	\N	48.97	2.99	3.92	55.88	completed	[{"id": 9, "price": 22.99, "quantity": 1}, {"id": 6, "price": 12.99, "quantity": 2}]	\N	2025-05-09 01:15:00.102	\N	\N	\N	\N	\N
39	Kevin Young	kevin.young@example.com	+353-763-9859	\N	41.97	2.99	3.36	48.32	completed	[{"id": 8, "price": 13.99, "quantity": 1}, {"id": 8, "price": 13.99, "quantity": 2}]	\N	2025-04-18 05:21:00.414	\N	\N	\N	\N	\N
40	Rachel King	rachel.king@example.com	+353-759-1378	\N	16.99	2.99	1.36	21.34	completed	[{"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-06-08 12:17:31.725	\N	\N	\N	\N	\N
41	Brandon Wright	brandon.wright@example.com	+353-175-1438	\N	59.97	2.99	4.8	67.76	completed	[{"id": 9, "price": 22.99, "quantity": 2}, {"id": 8, "price": 13.99, "quantity": 1}]	\N	2025-05-29 07:12:57.235	\N	\N	\N	\N	\N
42	Melissa Scott	melissa.scott@example.com	+353-707-8899	\N	55.96	2.99	4.48	63.43	completed	[{"id": 6, "price": 12.99, "quantity": 2}, {"id": 5, "price": 14.99, "quantity": 2}]	\N	2025-06-12 04:45:21.236	\N	\N	\N	\N	\N
43	Tyler Green	tyler.green@example.com	+353-174-1201	\N	16.99	2.99	1.36	21.34	completed	[{"id": 7, "price": 16.99, "quantity": 1}]	\N	2025-06-08 23:04:27.443	\N	\N	\N	\N	\N
45	Jonathan Baker	jonathan.baker@example.com	+353-147-1259	\N	54.97	2.99	4.4	62.36	completed	[{"id": 7, "price": 16.99, "quantity": 1}, {"id": 5, "price": 14.99, "quantity": 1}, {"id": 9, "price": 22.99, "quantity": 1}]	\N	2025-06-03 01:58:34.57	\N	\N	\N	\N	\N
46	Rebecca Turner	rebecca.turner@example.com	+353-550-9880	Leave at door	75.96	2.99	6.08	85.03	completed	[{"id": 9, "price": 22.99, "quantity": 1}, {"id": 9, "price": 22.99, "quantity": 1}, {"id": 5, "price": 14.99, "quantity": 2}]	\N	2025-05-09 20:41:05.652	\N	\N	\N	\N	\N
49	Yash Choudhary		08824454998		51.96	2.99	4.1568000000000005	53.91080000000001	confirmed	[{"id": 1750195673032, "name": "Double Smash Burger", "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800", "price": 14.99, "prepTime": null, "quantity": 2, "menuItemId": 5}, {"id": 1750195685367, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 2, "menuItemId": 3}]	1	2025-06-17 21:30:27.767344	\N	\N	\N	\N	\N
50	Yash Choudhary		08824454998		36.97	2.99	3.697	39.96	confirmed	[{"id": 1750190292043, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 2, "menuItemId": 3}, {"id": 1750190398256, "name": "Double Smash Burger", "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800", "price": 14.99, "quantity": 1, "menuItemId": 5}]	1	2025-06-17 22:12:23.384095	\N	\N	\N	\N	\N
51	Yash Choudhary		08824454998		10.99	2.99	1.099	13.98	confirmed	[{"id": 1750198589754, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-17 22:18:34.517695	\N	\N	\N	\N	\N
52	Yash Choudhary		08824454998		6.99	2.99	0.6990000000000001	10.679	confirmed	[{"id": 1750198964659, "name": "Fresh Berry Smoothie", "image": "https://images.unsplash.com/photo-1553530666-ba11a90a0868", "price": 6.99, "prepTime": 15, "quantity": 1, "menuItemId": 12}]	1	2025-06-17 22:25:09.894924	\N	\N	\N	\N	\N
53	Yash Choudhary		08824454998		10.99	2.99	1.099	13.98	confirmed	[{"id": 1750199123284, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-17 22:28:47.713058	\N	\N	\N	\N	\N
54	Yash Choudhary		08824454998		10.99	2.99	1.099	13.98	confirmed	[{"id": 1750199580296, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-17 22:33:33.312844	\N	\N	\N	\N	\N
55	Yash Choudhary		08824454998		17.98	2.99	1.798	22.768	confirmed	[{"id": 1750199627518, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}, {"id": 1750199633162, "name": "Truffle Fries", "image": "https://drive.google.com/file/d/1bfcomLdjqRtoPht1PTVklHFoF0SFy2S_/view?usp=drive_link", "price": 6.99, "prepTime": 15, "quantity": 1, "menuItemId": 7}]	1	2025-06-17 22:34:32.021604	\N	\N	\N	\N	\N
56	Yash Choudhary		08824454998		21.98	2.99	2.198	27.168	confirmed	[{"id": 1750200355164, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 2, "menuItemId": 3}]	1	2025-06-17 22:46:31.307903	\N	\N	\N	\N	\N
57	Yash		696969696969		62.95	2.99	6.295000000000001	65.94	completed	[{"id": 1750200781998, "name": "Double Smash Burger", "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800", "price": 14.99, "quantity": 2, "menuItemId": 1}, {"id": 1750200783548, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 3, "menuItemId": 3}]	\N	2025-06-17 22:55:52.429859	\N	\N	\N	\N	\N
58	Sexy Shanks		696969696969		7.99	2.99	0.799	11.779	completed	[{"id": 1750200553670, "name": "Chocolate Lava Cake", "image": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51", "price": 7.99, "prepTime": 15, "quantity": 1, "menuItemId": 9}]	\N	2025-06-17 22:57:29.674988	\N	\N	\N	\N	\N
75	Final Verification	verify@test.com	555-555-5555	\N	16.99	2.99	1.59	21.57	cancelled	[{"id": 5, "name": "Verification Item", "price": 16.99, "quantity": 1}]	\N	2025-06-18 15:54:03.305312	5	\N	\N	\N	\N
74	Consistency Test	consistency@test.com	555-111-2222	\N	14.99	2.99	1.43	19.41	cancelled	[{"id": 4, "name": "Consistency Burger", "price": 14.99, "quantity": 1}]	\N	2025-06-18 15:53:49.072702	4	\N	\N	\N	\N
73	Final Test User	final@test.com	555-000-1111	\N	13.99	2.99	1.35	18.33	cancelled	[{"id": 3, "name": "Final Test Item", "price": 13.99, "quantity": 1}]	\N	2025-06-18 15:50:21.804445	3	\N	\N	\N	\N
79	Yash Choudhary		08824454998		10.99	2.99	1.099	10.243400000000001	cancelled	[{"id": 1750270523851, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-18 18:16:13.876834	9	\N	\N	HI44	\N
78	Yash Choudhary		08824454998		10.99	2.99	1.099	10.243400000000001	cancelled	[{"id": 1750269780322, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	1	2025-06-18 18:03:41.106966	8	\N	\N	HI44	\N
77	Yash Choudhary		08824454998		54.95	2.99	5.495000000000001	39.257000000000005	cancelled	[{"id": 1750268448494, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 5, "menuItemId": 3}]	1	2025-06-18 17:57:52.558628	7	\N	\N	HI44	\N
76	Test Customer	test@example.com	1234567890	\N	25	2.99	2.24	30.23	cancelled	[{"id": 1, "name": "Test Item", "price": 25, "quantity": 1}]	\N	2025-06-18 17:57:39.269822	6	\N	\N	HI44	\N
72	End-to-End Test	e2e@test.com	555-999-8888	\N	18.99	2.99	1.75	23.73	cancelled	[{"id": 2, "name": "Test Pizza", "price": 18.99, "quantity": 1}]	\N	2025-06-18 15:49:24.066992	2	\N	\N	\N	\N
71	Test Customer	test@example.com	555-123-4567	\N	25.98	2.99	2.32	31.29	cancelled	[{"id": 1, "name": "Test Burger", "price": 12.99, "quantity": 2}]	\N	2025-06-18 15:48:52.396603	1	\N	\N	\N	\N
80	Yash Choudhary		08824454998		30	2.99	3	22.790000000000003	confirmed	[{"id": 1750289201215, "name": "fasDvds", "image": "https://www.istockphoto.com/photos/splash", "price": 30, "prepTime": 15, "quantity": 1, "menuItemId": 14}]	1	2025-06-18 23:33:16.293379	10	\N	\N	HI44	\N
81	Yash Choudhary		08824454998		19.99	2.99	1.9989999999999999	24.978999999999996	confirmed	[{"id": 1750349950172, "name": "Database Fixed Test", "image": "", "price": 19.99, "prepTime": 12, "quantity": 1, "menuItemId": 20}]	1	2025-06-19 16:39:05.442491	2	\N	\N		\N
82	Yash from Guest browser		12345678887		18.6315	2.99	1.86315	21.621499999999997	completed	[{"id": 1750552283906, "name": "New York Cheesecake", "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416", "price": 7.6415, "quantity": 1, "menuItemId": 10}, {"id": 1750552285548, "name": "Spinach Artichoke Dip", "image": "https://images.unsplash.com/photo-1576506295286-5cda18df43e7", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 3}]	\N	2025-06-22 00:32:38.964577	1	\N	\N	WELCOME10	\N
83	Yash Choudhary		08824454998		14.99	3.99	1.499	20.479	confirmed	[{"id": 1750560116066, "name": "The Mex Burger", "image": "https://scontent.fjai8-1.fna.fbcdn.net/v/t39.30808-6/470203602_18016000436644923_8240666612134347088_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=NQCtLgdrBh8Q7kNvwEbShKP&_nc_oc=AdmB5vMltpDpM7mZbvRIWOwd2eCi7R2SGQNdSzfsuUYnZ8yZHqLuhfFyku9Vakwzu0M&_nc_zt=23&_nc_ht=scontent.fjai8-1.fna&_nc_gid=0B6_nnevdJ6v5UPHyoBQrQ&oh=00_AfNeoHzlP2PlPyw1h6ERWK0zKHSOddpBQFCrmknj4okrLQ&oe=685D2FD9", "price": 14.99, "prepTime": 15, "quantity": 1, "menuItemId": 5}]	7	2025-06-22 02:42:26.395243	2	\N	\N		\N
84	Yash Choudhary		08824454998		18.6315	3.99	1.86315	24.48465	completed	[{"id": 1750554416005, "name": "New York Cheesecake", "image": "https://images.unsplash.com/photo-1567171466295-4afa63d45416", "price": 7.6415, "quantity": 1, "menuItemId": 10}, {"id": 1750560584789, "name": "Grilled Salmon", "image": "https://images.unsplash.com/photo-1565299507177-b0ac66763828", "price": 10.99, "prepTime": 15, "quantity": 1, "menuItemId": 4}]	1	2025-06-22 02:50:22.897358	3	\N	\N		\N
85	Yash Choudhary		08824454998		5.99	3.99	0.5990000000000001	10.579	completed	[{"id": 1750561112150, "name": "Garlic Bread", "image": "https://imgs.search.brave.com/xtegsNIrPFU5Kpy-_XBLn-Cl20Ib1RsEX4tQjwh_pvQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvNTQ3/MDQ2MzkwL3Bob3Rv/L2dhcmxpYy1icmVh/ZC5qcGc_cz02MTJ4/NjEyJnc9MCZrPTIw/JmM9b0FyTmdrYmpq/UEtsVG9EbkJoTDd4/TndVNF9lSkxQVGFM/YkFsSXV1bkhEWT0", "price": 5.99, "prepTime": 15, "quantity": 1, "menuItemId": 8}]	1	2025-06-22 02:58:58.481497	4	\N	\N		\N
86	Yash Choudhary		08824454998		6.99	3.99	0.6990000000000001	11.679	completed	[{"id": 1750561385162, "name": "Truffle Fries", "image": "https://drive.google.com/file/d/1bfcomLdjqRtoPht1PTVklHFoF0SFy2S_/view?usp=drive_link", "price": 6.99, "prepTime": 15, "quantity": 1, "menuItemId": 7}]	1	2025-06-22 03:03:26.051106	5	\N	\N		\N
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.promo_codes (id, code, discount_type, discount_value, min_order_value, max_discount_amount, active, usage_limit, current_usage, start_date, end_date, created_at) FROM stdin;
3	HI5	percentage	5	0	\N	t	100	0	1970-01-01 00:00:00	2025-06-18 00:00:00	2025-06-18 17:40:37.91433
1	WELCOME10	percentage	10	10	\N	t	100	1	2025-05-02 00:50:11.681566	2025-12-31 00:00:00	2025-05-02 00:50:11.681566
4	HI44	percentage	44	0	\N	f	100	5	1970-01-01 00:00:00	2025-06-21 18:29:59	2025-06-18 17:52:22.410179
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
TXgLY1hy6iRmIlHu_olLIT9YORBJjTS7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T03:05:18.717Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 06:02:41
4LD5vSs2Rfgq9m_gL6IHsAoB6hXAp6_e	{"cookie":{"originalMaxAge":604799999,"expires":"2025-06-29T03:14:06.311Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 03:15:08
-Fko3uVCwQla-ulVFhY1XKWJmxtJ53sf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-25T16:35:18.600Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-25 17:50:46
RVq_U3OvLFnq_dCnysI4-u0Jym_oLYQv	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T03:15:13.233Z","secure":false,"httpOnly":true,"path":"/"}}	2025-06-29 03:15:14
eVdSHdeMZAR68L6W5dKJpMCZ2e8Wza4u	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:21:30.945Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:21:32
Qkkn5mn1psNRKAB5_QlIXIb_4M_jQg6i	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T03:15:14.521Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 03:15:28
mIb5D2msvsvgDB2y5Hr_5eFYvRJvN3gQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-25T15:08:15.981Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-25 18:20:10
ey0T9j4ZtcyhdEc2HmSx1xQ3k3_gI8fE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-25T23:05:02.944Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-26 01:21:16
0kgV-Ts-cBVohq1xL5iSQBGyDQeeG4uA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T05:28:42.653Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 05:28:44
l605gEnQ94alBXR3POhEmTFbeuaRkF1q	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:53:37.935Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:53:39
kl8bSUtj3nMkqV3JLHtUhNIDCSS0wS3u	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T05:28:56.611Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 05:28:58
tM3qeDX13yGtb_k5JxLziV_5RLY4owYn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:45:32.203Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:45:33
Wefy46VaaDDZhJUhLh_BEpeuMKU-Ay9x	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-24T19:37:26.423Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-25 14:12:19
63E0I_P13fa07Do1BPWOpLRmmFgU5qZO	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:29:07.429Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:29:08
Tx2Ohtr9YukPQqk6XV8daCvU3e-7JxXh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T03:16:00.140Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 03:16:55
dwg9dmmiJM7p0yJRVuqQcCIqRG2BPuWM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-25T13:29:28.363Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-25 14:21:27
ga0bsSmA0klGmHGgTqqEe7XXFsp8dNNa	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T00:45:55.440Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 01:45:39
M6WVdU1pvjJLdn_l52faCLL7AmHhD-EL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-26T15:48:36.441Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-27 12:04:37
RLKCWRVxu9AtwBL6NgG7QJAovT8L5Ubb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T03:17:15.086Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 03:17:16
zdAe_wHQMSgRTxPpUs7nqATEr-We1RXb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:36:53.912Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:36:55
lpQzXlKPeWugci3ywASCML3qp6AIfaVM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T06:46:08.157Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 06:46:09
DAIXScfLnpxNPbumBWqP1nIJN9NWFgYL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:20:41.146Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:20:42
l_AU1gYHiTH3CcFeibdDUOCyBg9CaKHd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:44:59.269Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:45:12
Gog2AgaN0Q0pHH4ndw6J2qlrJHsmkgCR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T06:45:49.099Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 06:45:50
eLobflM4mLiXfpNNgUoXJ6yYxzM4POCF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:51:57.614Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:51:59
QBjjFt6v-NY81BTxV-0UgmrMV5GaxkPY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T04:20:59.466Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 04:21:07
10OhtSi72ZIb3rzhH1IiG72sS7MYG05s	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T06:46:29.802Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 06:46:32
t2SNn4r3-X5HIKrYC7A8w4afZjhXFBrZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T06:46:44.471Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 06:46:47
oG1ETDGbWHdC3tNNqFk50QBoVNrrk8Bv	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T07:49:30.792Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 09:31:17
jU0GimjmPa8ddTnTd0ylYVXtvdFZZ5oF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-24T20:20:00.549Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-25 00:30:40
XPQYRIZKK9ni30mT_O0jOhI96sOOgu8O	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T05:26:10.207Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 05:26:11
uYezT3ohWzCgTqSXIX0QxvpAx5FDXHjE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T05:26:26.796Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 05:26:28
J-cTxi12FdLc5umBfKPAWqRAuJuifFQT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-06-29T10:37:02.101Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-06-29 13:39:42
\.


--
-- Data for Name: special_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.special_offers (id, menu_item_id, discount_type, discount_value, original_price, special_price, active, start_date, end_date) FROM stdin;
1	11	percentage	50	12.99	6.495	f	2025-06-18 16:59:23.951	\N
2	10	percentage	15	8.99	7.6415	f	2025-06-18 17:03:06.374	\N
3	9	percentage	15	7.99	6.7915	f	2025-06-18 17:03:54.856	\N
4	9	percentage	15	7.99	6.7915	f	2025-06-18 17:07:51.054	\N
5	10	percentage	15	8.99	7.6415	f	2025-06-18 17:08:51.253	\N
6	9	percentage	15	7.99	6.7915	f	2025-06-01 00:00:00	\N
7	9	percentage	15	7.99	6.7915	f	2025-06-18 23:22:14.173	\N
8	9	percentage	15	7.99	6.7915	f	2025-06-18 23:35:00.757	\N
9	12	percentage	15	6.99	5.9415000000000004	f	2025-06-18 23:35:24.264	\N
10	9	percentage	15	7.99	6.7915	f	2025-06-18 23:39:25.596	\N
11	10	percentage	15	8.99	7.6415	f	2025-06-19 15:49:38.012	\N
12	10	percentage	15	8.99	7.6415	f	2025-06-21 22:56:46.818	\N
13	10	percentage	15	8.99	7.6415	f	2025-06-22 01:35:00.953	2025-06-30 00:00:00
14	10	percentage	50	8.99	4.495	f	2025-06-22 01:35:16.187	\N
15	5	percentage	15	14.99	12.7415	t	2025-06-22 08:04:50.341	\N
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_settings (id, key, value, updated_at) FROM stdin;
1	service_fee	3	2025-06-22 12:08:11.136
2	tax_rate	5	2025-06-22 12:08:11.137
10	store_open	true	2025-06-22 13:37:18.278
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, role, created_at) FROM stdin;
2	Yash	$2b$10$mFXwKoNIbc.Q2O1Vb3gT8O.JlDFlfai/j/tLcP55WW49/d2cziBCq	yashchoudhary13@outlook.com	user	2025-04-29 00:25:43.190593
6	yash7541	$2b$10$zq6j5DhMR.mhO58/bKXcW.UWkg0LUevVrM3V9HaJ6tyf638LJ8PGW	mailtoyash16@gmail.com	user	2025-05-02 04:09:05.17431
7	randomUser1	$2b$10$5NH7S23AGVp5TcTDqRfUkePHJfmeue3FKjaFwdLmvy.n8sCcJOiE6		user	2025-06-22 02:41:43.963383
9	admin	$2b$10$qzfJKARQo5AF.jTXEBFpK.TLvVGSLEEbB6vqdVJiYI/COGThaRBDW	\N	admin	2025-06-22 06:46:52.640122
1	admin1234	$2b$10$zkDUkGGzLJFTb11zv0kSXeJ5PV8e4i6XmqBUb5jioitn8PFt1r.Mm	themexcobh@gmail.com	admin	2025-04-29 00:02:37.190796
\.


--
-- Name: daily_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.daily_reports_id_seq', 3, true);


--
-- Name: menu_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_categories_id_seq', 17, true);


--
-- Name: menu_item_option_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_item_option_groups_id_seq', 1, true);


--
-- Name: menu_item_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_item_options_id_seq', 2, true);


--
-- Name: menu_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.menu_items_id_seq', 61, true);


--
-- Name: monthly_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.monthly_reports_id_seq', 1, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 87, true);


--
-- Name: promo_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.promo_codes_id_seq', 4, true);


--
-- Name: special_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.special_offers_id_seq', 15, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 14, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: daily_reports daily_reports_date_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_date_key UNIQUE (date);


--
-- Name: daily_reports daily_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_pkey PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_categories menu_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_slug_key UNIQUE (slug);


--
-- Name: menu_item_option_groups menu_item_option_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_option_groups
    ADD CONSTRAINT menu_item_option_groups_pkey PRIMARY KEY (id);


--
-- Name: menu_item_options menu_item_options_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_options
    ADD CONSTRAINT menu_item_options_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: monthly_reports monthly_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.monthly_reports
    ADD CONSTRAINT monthly_reports_pkey PRIMARY KEY (id);


--
-- Name: monthly_reports monthly_reports_year_month_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.monthly_reports
    ADD CONSTRAINT monthly_reports_year_month_key UNIQUE (year, month);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: special_offers special_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.special_offers
    ADD CONSTRAINT special_offers_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: menu_item_option_groups menu_item_option_groups_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_option_groups
    ADD CONSTRAINT menu_item_option_groups_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);


--
-- Name: menu_item_options menu_item_options_option_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.menu_item_options
    ADD CONSTRAINT menu_item_options_option_group_id_fkey FOREIGN KEY (option_group_id) REFERENCES public.menu_item_option_groups(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--



--
-- PostgreSQL database dump complete
--

