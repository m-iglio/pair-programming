# Entretien technique Poste developpeur.euse JS frontend: Session Pair Programming

## Tech Stack

- [antd](https://ant.design/components/overview/): librarie d'element d'UI
- [redux](https://redux.js.org/) et [react-redux](https://react-redux.js.org/): gestion d'etat global

## Issue

**Base map order for Bing & OSM**

The base maps, including Bing & OSM, need to be ordered according to the orderIndex set by the server.
To do:

- Split the custom layers group('customLayersGroup') so that OSM/Bing can be intercalated in between custom layers
- Remove the behavior which makes the first custom layer visible by default at first display - CUSTOMBASELAYERSDISPLAYED cookie
- Use the new user properties got from the "userdetails" endpoint - bingLayerIndex, osmLayerIndex - in order to sort the base layers. The custom layers display order is given by the 'orderIndex' property

Keep in mind that the active base layer is also set by the '#map=xxxx' element in the URL. we must not break the existing behavior.The base maps, including Bing & OSM, need to be ordered according to the orderIndex set by the server.
