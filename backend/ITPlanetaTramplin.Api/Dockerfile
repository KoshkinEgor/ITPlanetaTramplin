FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj backend/ITPlanetaTramplin.Api/
RUN dotnet restore backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/ITPlanetaTramplin.Api/ITPlanetaTramplin.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

ENV PORT=10000

COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT} dotnet ITPlanetaTramplin.Api.dll"]
